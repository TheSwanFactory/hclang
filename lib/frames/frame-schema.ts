import { Frame } from "./frame.ts";
import { FrameAlias } from "./frame-alias.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameBlob } from "./frame-blob.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameNumber } from "./frame-number.ts";
import { NilContext } from "./context.ts";
import type { SigilStart } from "../scan.ts";

type BitCapture = {
  name: string;
  bits: number | null;
};

type SchemaPattern =
  | { kind: "enumeration" }
  | { kind: "selector"; names: string[] }
  | { kind: "fixed"; bits: number }
  | { kind: "remainder" }
  | { kind: "sequence"; captures: BitCapture[] }
  | { kind: "invalid"; error: string };

export class FrameSchema extends FrameList {
  public static readonly BEGIN_SCHEMA = "<";
  public static readonly END_SCHEMA = ">";
  public static readonly SIGIL_STARTS = [
    { key: FrameSchema.BEGIN_SCHEMA, mode: "push" },
    { key: FrameSchema.END_SCHEMA, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  private pattern: SchemaPattern;

  constructor(
    data: Array<Frame>,
    meta = NilContext,
    pattern: SchemaPattern = { kind: "enumeration" },
  ) {
    super(data, meta);
    this.pattern = pattern;
  }

  public override string_open(): string {
    return FrameSchema.BEGIN_SCHEMA;
  }

  public override string_close(): string {
    return FrameSchema.END_SCHEMA;
  }

  public override in(contexts = [Frame.nil]): Frame {
    const pattern = this.detectPattern();
    if (pattern.kind !== "enumeration") {
      return new FrameSchema([...this.data], NilContext, pattern);
    }
    const array = this.array_eval(contexts);
    return new FrameSchema(array);
  }

  public override apply(argument: Frame, parameter: Frame): Frame {
    switch (this.pattern.kind) {
      case "enumeration":
        return this.matches(argument) ? argument : Frame.error(
          `$!.type-error ${this.toString()} ${argument.toString()}`,
        );
      case "selector":
        return this.select(argument, parameter);
      case "fixed":
        return this.captureExact(argument, this.pattern.bits);
      case "remainder":
        return argument instanceof FrameBlob
          ? argument
          : Frame.error(`$!.bit-input-invalid ${argument.toString()}`);
      case "sequence":
        return this.captureSequence(argument, this.pattern.captures);
      case "invalid":
        return Frame.error(this.pattern.error);
    }
  }

  public override toString(): string {
    switch (this.pattern.kind) {
      case "selector":
        return `<${this.pattern.names.map((name) => `.${name}`).join(", ")}>`;
      case "fixed":
        return `<${this.pattern.bits}@Bit>`;
      case "remainder":
        return "<[@Bit]>";
      case "sequence":
        return `<[${
          this.pattern.captures.map((capture) =>
            `.${capture.name} ${
              capture.bits == null ? "<[@Bit]>" : `<${capture.bits}@Bit>`
            };`
          ).join(" ")
        }]>`;
      default:
        return super.toString();
    }
  }

  public override dataString(): string {
    return this.pattern.kind === "enumeration"
      ? super.dataString()
      : this.toString();
  }

  public override at(index: number): Frame | FrameNote {
    if (index >= this.size() || -index > this.size()) {
      const source = "[0.." + this.size() + "]." + index;
      return FrameNote.index(source);
    }
    if (index >= 0) {
      return this.data[index];
    }
    const n = this.data.length;
    return this.data[n + index];
  }

  public length(): number {
    return this.data.length;
  }

  /** Whether a value belongs to this enumerated schema. */
  public matches(value: Frame): boolean {
    if (this.pattern.kind !== "enumeration") {
      return !this.apply(value, Frame.nil).is.error;
    }
    return this.length() === 0 ||
      this.data.some((candidate) => candidate.isEqualTo(value));
  }

  private detectPattern(): SchemaPattern {
    const selectors = this.data.map((item) => unwrapSingleton(item));
    if (
      selectors.length > 0 &&
      selectors.every((item) => item instanceof FrameName)
    ) {
      return {
        kind: "selector",
        names: selectors.map((item) => (item as FrameName).source),
      };
    }

    if (this.data.length === 1) {
      const expression = this.data[0];
      const terms = expression instanceof FrameList
        ? expression.asArray().map(unwrapSingleton)
        : [];
      if (
        terms.length === 2 && terms[0] instanceof FrameNumber &&
        isBitAlias(terms[1])
      ) {
        const bits = Number(terms[0].valueOf());
        return Number.isInteger(bits) && bits > 0
          ? { kind: "fixed", bits }
          : { kind: "invalid", error: "$!.unsupported-schema-form" };
      }

      const array = unwrapSingleton(expression);
      if (array instanceof FrameArray) {
        const entries = array.asArray();
        if (
          entries.length === 1 && isBitAlias(unwrapSingleton(entries[0]))
        ) {
          return { kind: "remainder" };
        }
        return this.detectSequence(entries);
      }
    }

    if (containsPatternSyntax(this.data)) {
      return { kind: "invalid", error: "$!.unsupported-schema-form" };
    }
    return { kind: "enumeration" };
  }

  private detectSequence(entries: Frame[]): SchemaPattern {
    if (entries.length === 0) {
      return { kind: "invalid", error: "$!.unsupported-schema-form" };
    }
    const captures: BitCapture[] = [];
    const names = new Set<string>();
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      const terms = entry instanceof FrameList
        ? entry.asArray().map(unwrapSingleton)
        : [];
      if (
        terms.length !== 2 || !(terms[0] instanceof FrameName) ||
        !(terms[1] instanceof FrameSchema)
      ) {
        return { kind: "invalid", error: "$!.unsupported-schema-form" };
      }
      const name = terms[0].source;
      if (names.has(name)) {
        return {
          kind: "invalid",
          error: `$!.duplicate-capture-name .${name}`,
        };
      }
      names.add(name);
      const nested = terms[1].detectPattern();
      if (nested.kind === "remainder") {
        if (index !== entries.length - 1) {
          return {
            kind: "invalid",
            error: `$!.invalid-remainder-position .${name}`,
          };
        }
        captures.push({ name, bits: null });
      } else if (nested.kind === "fixed") {
        captures.push({ name, bits: nested.bits });
      } else {
        return { kind: "invalid", error: "$!.unsupported-schema-form" };
      }
    }
    return { kind: "sequence", captures };
  }

  private select(argument: Frame, origin: Frame): Frame {
    if (argument.meta_length() === 0) {
      return Frame.error(`$!.selector-input-invalid ${argument.toString()}`);
    }
    const values: Frame[] = [];
    const names =
      (this.pattern as Extract<SchemaPattern, { kind: "selector" }>).names;
    for (const name of names) {
      const binding = argument.resolve_here(name, origin);
      if (binding?.value.is.error) return binding.value;
      if (!binding) return Frame.error(`$!.property-missing .${name}`);
      values.push(binding.value);
    }
    return new FrameArray(values);
  }

  private captureExact(argument: Frame, bits: number): Frame {
    if (!(argument instanceof FrameBlob)) {
      return Frame.error(`$!.bit-input-invalid ${argument.toString()}`);
    }
    if (argument.bitLength() < bits) {
      return Frame.error(`$!.insufficient-bits <${bits}@Bit> 0`);
    }
    if (argument.bitLength() > bits) {
      return Frame.error(`$!.unconsumed-bits ${argument.bitLength() - bits}`);
    }
    return argument;
  }

  private captureSequence(argument: Frame, captures: BitCapture[]): Frame {
    if (!(argument instanceof FrameBlob)) {
      return Frame.error(`$!.bit-input-invalid ${argument.toString()}`);
    }
    let offset = 0;
    const result = new FrameArray([]);
    for (const capture of captures) {
      const width = capture.bits ?? argument.bitLength() - offset;
      if (width <= 0) {
        return Frame.error(`$!.insufficient-bits .${capture.name} ${offset}`);
      }
      if (offset + width > argument.bitLength()) {
        return Frame.error(`$!.insufficient-bits .${capture.name} ${offset}`);
      }
      result.set(capture.name, argument.sliceBits(offset, width));
      offset += width;
    }
    if (offset < argument.bitLength()) {
      return Frame.error(`$!.unconsumed-bits ${argument.bitLength() - offset}`);
    }
    return result;
  }
}

function unwrapSingleton(frame: Frame): Frame {
  let result = frame;
  while (
    result instanceof FrameList && !(result instanceof FrameArray) &&
    !(result instanceof FrameSchema) && result.size() === 1
  ) {
    result = result.asArray()[0];
  }
  return result;
}

function isBitAlias(frame: Frame): boolean {
  return frame instanceof FrameAlias && frame.toString() === "@Bit";
}

function containsPatternSyntax(frames: Frame[]): boolean {
  return frames.some((frame) => {
    if (
      frame instanceof FrameName || frame instanceof FrameAlias ||
      frame instanceof FrameArray
    ) return true;
    return frame instanceof FrameList && containsPatternSyntax(frame.asArray());
  });
}
