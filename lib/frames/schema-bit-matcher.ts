import { Frame } from "./frame.ts";
import { FrameAlias } from "./frame-alias.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameBlob } from "./frame-blob.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameNumber } from "./frame-number.ts";
import { matchFailure, type MatchResult, matchSuccess } from "./frame-match.ts";
import {
  isSchemaFrame,
  type SchemaMatcher,
  UnsupportedSchemaMatcher,
  unwrapSchemaSyntax,
} from "./schema-matcher.ts";

type BitCapture = {
  name: string;
  bits: number | null;
};

/** Compile only schemas that use the built-in Bit matcher syntax. */
export function compileBitSchemaMatcher(
  data: Frame[],
): SchemaMatcher | undefined {
  if (data.length === 1) {
    const expression = data[0];
    const terms = expression instanceof FrameList
      ? expression.asArray().map(unwrapSchemaSyntax)
      : [];
    if (
      terms.length === 2 && terms[0] instanceof FrameNumber &&
      isBitAlias(terms[1])
    ) {
      const bits = Number(terms[0].valueOf());
      return Number.isInteger(bits) && bits > 0
        ? new ExactBitSchemaMatcher(bits)
        : new UnsupportedSchemaMatcher();
    }

    const array = unwrapSchemaSyntax(expression);
    if (array instanceof FrameArray) {
      const entries = array.asArray();
      if (
        entries.length === 1 && isBitAlias(unwrapSchemaSyntax(entries[0]))
      ) {
        return new RemainderBitSchemaMatcher();
      }
      const sequence = compileBitSequence(entries);
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

  public format(): string {
    return `<${this.bits}@Bit>`;
  }
}

class RemainderBitSchemaMatcher implements SchemaMatcher {
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
      const width = capture.bits ?? value.bitLength() - offset;
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

  public format(): string {
    return `<[${
      this.captures.map((capture) =>
        `.${capture.name} ${
          capture.bits == null ? "<[@Bit]>" : `<${capture.bits}@Bit>`
        };`
      ).join(" ")
    }]>`;
  }
}

function compileBitSequence(entries: Frame[]): SchemaMatcher | undefined {
  if (entries.length === 0) return undefined;
  const captures: BitCapture[] = [];
  const names = new Set<string>();

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const terms = entry instanceof FrameList
      ? entry.asArray().map(unwrapSchemaSyntax)
      : [];
    if (
      terms.length !== 2 || !(terms[0] instanceof FrameName) ||
      !isSchemaFrame(terms[1])
    ) {
      return containsBitSyntax(entries)
        ? new UnsupportedSchemaMatcher()
        : undefined;
    }

    const nested = compileBitSchemaMatcher(terms[1].asArray());
    if (
      !(nested instanceof ExactBitSchemaMatcher) &&
      !(nested instanceof RemainderBitSchemaMatcher)
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

    if (nested instanceof RemainderBitSchemaMatcher) {
      if (index !== entries.length - 1) {
        return new UnsupportedSchemaMatcher(
          `$!.invalid-remainder-position .${name}`,
        );
      }
      captures.push({ name, bits: null });
    } else {
      captures.push({ name, bits: nested.bits });
    }
  }

  return new BitSequenceSchemaMatcher(captures);
}

function isBitAlias(frame: Frame): boolean {
  return frame instanceof FrameAlias && frame.toString() === "@Bit";
}

function containsBitSyntax(frames: Frame[]): boolean {
  return frames.some((frame) => {
    if (isBitAlias(frame)) return true;
    return frame instanceof FrameList && containsBitSyntax(frame.asArray());
  });
}
