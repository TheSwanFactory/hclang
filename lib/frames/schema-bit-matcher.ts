import { FrameCount } from "./frame-count.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";
import { Frame } from "./frame.ts";
import { FrameAlias } from "./frame-alias.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameBlob } from "./frame-blob.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameNumeric, REPETITION_TEXT_LIMIT } from "./frame-numeric.ts";
import { matchFailure, type MatchResult, matchSuccess } from "./frame-match.ts";
import {
  callSchemaPredicate,
  isSchemaFrame,
  type SchemaMatcher,
  schemaPredicateHasEffect,
  UnsupportedSchemaMatcher,
  unwrapSchemaSyntax,
} from "./schema-matcher.ts";

type BitCapture = {
  name: string;
  bits: number | null | Frame;
};

/** Compile only schemas that use the built-in Bit matcher syntax. */
export function compileBitSchemaMatcher(
  data: Frame[],
  input?: EvaluationInput,
): SchemaMatcher | undefined {
  if (data.length === 1) {
    const expression = data[0];
    const terms = expression instanceof FrameList
      ? expression.asArray().map(unwrapSchemaSyntax)
      : [];
    const unit = terms.length === 2 ? bitUnit(terms[1]) : undefined;
    if (unit !== undefined) {
      const width = input === undefined ? terms[0] : terms[0].in(input);
      const exact = width instanceof FrameBlob
        ? width.unsignedValue()
        : width instanceof FrameNumeric
        ? width.exactInt(BigInt(Number.MAX_SAFE_INTEGER))
        : undefined;
      const bits = typeof exact === "bigint" ? exact * BigInt(unit) : undefined;
      return bits !== undefined && bits > 0n &&
          bits <= BigInt(Number.MAX_SAFE_INTEGER)
        ? new ExactBitSchemaMatcher(Number(bits))
        : new UnsupportedSchemaMatcher();
    }

    const array = unwrapSchemaSyntax(expression);
    if (array instanceof FrameArray) {
      const entries = array.asArray();
      if (
        entries.length === 1 && bitUnit(unwrapSchemaSyntax(entries[0])) === 1
      ) {
        return new RemainderBitSchemaMatcher();
      }
      const sequence = compileBitSequence(entries, input);
      if (sequence) return sequence;
    }
  }

  return containsBitSyntax(data) ? new UnsupportedSchemaMatcher() : undefined;
}

class ExactBitSchemaMatcher implements SchemaMatcher {
  public constructor(public readonly bits: number) {
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    if (!(value instanceof FrameBlob)) {
      return matchFailure(
        Frame.error(`$!.bit-input-invalid ${value.toString()}`),
      );
    }
    if (value.bitLength() < this.bits) {
      return matchFailure(
        Frame.error(`$!.insufficient-bits <${this.bits}@Bit> 0`),
      );
    }
    if (value.bitLength() > this.bits) {
      return matchFailure(
        Frame.error(`$!.unconsumed-bits ${value.bitLength() - this.bits}`),
      );
    }
    return matchSuccess(value);
  }

  public apply(schema: FrameList, value: Frame, origin: Frame): Frame {
    if (value instanceof FrameCount) {
      const digits = value.data.toString(2);
      return digits.length > this.bits ||
          BigInt(this.bits) > REPETITION_TEXT_LIMIT
        ? Frame.error(`$!.bit-width ${this.bits}`)
        : new FrameBlob(`0b${digits.padStart(this.bits, "0")}`);
    }
    const result = this.match(schema, value, origin);
    return result.matched ? result.evidence : result.error;
  }

  public format(): string {
    return `<${this.bits}@Bit>`;
  }
}

class RemainderBitSchemaMatcher implements SchemaMatcher {
  public readonly bits = null;

  public apply(schema: FrameList, value: Frame, origin: Frame): Frame {
    if (value instanceof FrameCount) {
      return new FrameBlob(`0b${value.data.toString(2)}`);
    }
    const result = this.match(schema, value, origin);
    return result.matched ? result.evidence : result.error;
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    return value instanceof FrameBlob
      ? matchSuccess(value)
      : matchFailure(Frame.error(`$!.bit-input-invalid ${value.toString()}`));
  }

  public format(): string {
    return "<[@Bit]>";
  }
}

class BitSequenceSchemaMatcher implements SchemaMatcher {
  public constructor(private readonly captures: BitCapture[]) {
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    if (!(value instanceof FrameBlob)) {
      return matchFailure(
        Frame.error(`$!.bit-input-invalid ${value.toString()}`),
      );
    }
    let offset = 0;
    const evidence = new FrameArray([]);
    for (const capture of this.captures) {
      const resolved = this.width(capture, evidence);
      if (resolved instanceof Frame) return matchFailure(resolved);
      const width = resolved ?? value.bitLength() - offset;
      if (width <= 0 || offset + width > value.bitLength()) {
        return matchFailure(
          Frame.error(`$!.insufficient-bits .${capture.name} ${offset}`),
        );
      }
      evidence.set(capture.name, value.sliceBits(offset, width));
      offset += width;
    }
    if (offset < value.bitLength()) {
      return matchFailure(
        Frame.error(`$!.unconsumed-bits ${value.bitLength() - offset}`),
      );
    }
    return matchSuccess(evidence);
  }

  private width(capture: BitCapture, evidence: Frame): number | null | Frame {
    if (!(capture.bits instanceof Frame)) return capture.bits;
    const answer = callSchemaPredicate(capture.bits, evidence);
    if (answer.is.error) return answer;
    const width = answer.isSchema() ? answer.bitWidth() : undefined;
    if (width === null && capture !== this.captures.at(-1)) {
      return Frame.error(`$!.invalid-remainder-position .${capture.name}`);
    }
    return width === undefined
      ? Frame.error(`$!.invalid-bit-capture .${capture.name}`)
      : width;
  }

  public construct(value: Frame): Frame {
    const evidence = new FrameArray([]);
    const parts: Frame[] = [];
    for (const capture of this.captures) {
      const binding = value.resolve_here(capture.name, Frame.nil);
      if (!binding) return Frame.error(`$!.property-missing .${capture.name}`);
      const part = binding.value;
      if (part.is.error) return part;
      const width = this.width(capture, evidence);
      if (width instanceof Frame) return width;
      if (!(part instanceof FrameBlob)) {
        return Frame.error(`$!.bit-input-invalid ${part.toString()}`);
      }
      if (width !== null && part.bitLength() !== width) {
        return Frame.error(`$!.bit-width ${width}`);
      }
      parts.push(part);
      evidence.set(capture.name, part);
    }
    return new FrameArray(parts);
  }

  public format(): string {
    return `<[${
      this.captures.map((capture) =>
        `.${capture.name} ${
          capture.bits instanceof Frame
            ? capture.bits.toString()
            : capture.bits == null
            ? "<[@Bit]>"
            : `<${capture.bits}@Bit>`
        };`
      ).join(" ")
    }]>`;
  }
}

function compileBitSequence(
  entries: Frame[],
  input?: EvaluationInput,
): SchemaMatcher | undefined {
  if (entries.length === 0 || !containsBitSyntax(entries)) return undefined;
  const captures: BitCapture[] = [];
  const names = new Set<string>();

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const terms = entry instanceof FrameList
      ? entry.asArray().map(unwrapSchemaSyntax)
      : [];
    if (
      terms.length !== 2 || !(terms[0] instanceof FrameName) ||
      !(isSchemaFrame(terms[1]) || terms[1].isClosure())
    ) {
      return containsBitSyntax(entries)
        ? new UnsupportedSchemaMatcher()
        : undefined;
    }

    const capture = terms[1];
    const deferred = capture.isClosure() ? capture.in(input) : undefined;
    if (deferred && schemaPredicateHasEffect(deferred)) {
      return new UnsupportedSchemaMatcher("$!.schema-predicate-effect");
    }
    const nested = deferred ??
      compileBitSchemaMatcher(capture.asArray(), input);
    if (
      !(nested instanceof ExactBitSchemaMatcher) &&
      !(nested instanceof RemainderBitSchemaMatcher) && !deferred
    ) {
      return containsBitSyntax(entries)
        ? new UnsupportedSchemaMatcher()
        : undefined;
    }

    const name = terms[0].source;
    if (names.has(name)) {
      return new UnsupportedSchemaMatcher(`$!.duplicate-capture-name .${name}`);
    }
    names.add(name);

    if (deferred) {
      captures.push({ name, bits: deferred });
    } else if (nested instanceof RemainderBitSchemaMatcher) {
      if (index !== entries.length - 1) {
        return new UnsupportedSchemaMatcher(
          `$!.invalid-remainder-position .${name}`,
        );
      }
      captures.push({ name, bits: null });
    } else if (nested instanceof ExactBitSchemaMatcher) {
      captures.push({ name, bits: nested.bits });
    }
  }

  return new BitSequenceSchemaMatcher(captures);
}

function bitUnit(frame: Frame): number | undefined {
  if (!(frame instanceof FrameAlias)) return undefined;
  return frame.toString() === "@Bit"
    ? 1
    : frame.toString() === "@Byte"
    ? 8
    : undefined;
}

function isBitAlias(frame: Frame): boolean {
  return bitUnit(frame) !== undefined;
}

function containsBitSyntax(frames: Frame[]): boolean {
  return frames.some((frame) => {
    if (isBitAlias(frame)) return true;
    return frame instanceof FrameList && containsBitSyntax(frame.asArray());
  });
}
