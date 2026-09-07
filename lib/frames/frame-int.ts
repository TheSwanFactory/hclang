import { completeAtEnd, includeOrReserve } from "./atom-syntax.ts";
import { type Context, NilContext } from "./context.ts";
import { FrameDecimal } from "./frame-decimal.ts";
import { Frame } from "./frame.ts";
import {
  exactBigIntPower,
  exactPowerWithinLimit,
  FrameNumeric,
  type NumericRank,
  REPETITION_LIMIT,
  REPETITION_TEXT_LIMIT,
} from "./frame-numeric.ts";
import { hasCharacterContent } from "./frame-text.ts";
import { FrameNumber } from "./frame-number.ts";
import type { MetaFrame } from "./meta-frame.ts";
import type { AtomSyntax, ScanResult, SigilStart } from "../scan.ts";

const INTEGER_SOURCE = /^[+-]?[\p{Nd}]+$/u;

function normalizeDecimalDigits(source: string): string {
  return Array.from(source, (character) => {
    if (/\d/.test(character)) return character;

    const codePoint = character.codePointAt(0);
    if (codePoint == null || !/\p{Nd}/u.test(character)) {
      throw new TypeError(`invalid integer source: ${source}`);
    }
    let blockStart = codePoint;
    while (
      blockStart > 0 &&
      /\p{Nd}/u.test(String.fromCodePoint(blockStart - 1))
    ) {
      blockStart -= 1;
    }
    return ((codePoint - blockStart) % 10).toString();
  }).join("");
}

/** Exact bigint-backed integer and owner of decimal-digit source syntax. */
export class FrameInt extends FrameNumeric {
  public static readonly NUMBER_BEGIN = /[1-9]/;
  public static readonly NUMBER_CHAR = /\d/;
  public static readonly SIGIL_STARTS = [
    { key: FrameInt.NUMBER_BEGIN.toString(), mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameInt",
    SIGIL_STARTS: FrameInt.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      return includeOrReserve(char, FrameInt.NUMBER_CHAR.test(char), source);
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => FrameInt.for(source),
  };

  public static for(source: string): FrameInt {
    return new FrameInt(source);
  }

  public readonly rank: NumericRank = 0;
  public readonly data: bigint;
  public readonly spelling: string;

  public constructor(
    source: string | bigint,
    meta: Context = NilContext,
    spelling?: string,
  ) {
    super(meta);
    const rendered = spelling ?? source.toString();
    if (!INTEGER_SOURCE.test(rendered)) {
      throw new TypeError(`invalid integer source: ${rendered}`);
    }
    const sign = rendered.startsWith("-") ? -1n : 1n;
    const digits = normalizeDecimalDigits(rendered.replace(/^[+-]/, ""));
    this.data = typeof source === "bigint" ? source : sign * BigInt(digits);
    this.spelling = rendered;
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (/^\d+$/.test(key)) {
      const sign = /^[+-]/.exec(this.spelling)?.[0] ?? "";
      const digits = normalizeDecimalDigits(
        this.spelling.replace(/^[+-]/, ""),
      );
      return new FrameDecimal(`${sign}${digits}.${key}`);
    }
    return super.lookup_here(key, origin);
  }

  public override exactInt(max?: bigint): bigint | Frame {
    return max != null && this.data > max
      ? Frame.error(`$!.integer-range ${this.spelling} ${max}`)
      : this.data;
  }

  public range(): number[] | Frame {
    const count = this.repetitionCount();
    return count instanceof Frame
      ? count
      : Array.from({ length: count }, (_, index) => index);
  }

  private repetitionCount(): number | Frame {
    if (this.data < 0n) {
      return Frame.error(`$!.repetition-count ${this.spelling}`);
    }
    if (this.data > REPETITION_LIMIT) {
      return Frame.error(`$!.repetition-limit ${REPETITION_LIMIT}`);
    }
    return Number(this.data);
  }

  public override string_start(): string {
    return FrameInt.NUMBER_BEGIN.toString();
  }

  public override valueOf(): number {
    return Number(this.data);
  }

  public override isZero(): boolean {
    return this.data === 0n;
  }

  protected override toData(): string {
    return this.spelling;
  }

  protected override promoteOne(): FrameNumeric {
    return FrameDecimal.fromParts(this.data, 0);
  }

  protected override ratioParts(): readonly [bigint, bigint] {
    return [this.data, 1n];
  }

  protected override inexactResult(value: number): Frame {
    return new FrameNumber(value);
  }

  protected override integralValue(): bigint {
    return this.data;
  }

  protected override unaryPlus(): Frame {
    if (this.spelling.startsWith("+") || this.spelling.startsWith("-")) {
      return this;
    }
    return new FrameInt(this.data, NilContext, `+${this.spelling}`);
  }

  protected override unaryMinus(): Frame {
    const unsigned = this.spelling.replace(/^[+-]/, "");
    const spelling = this.spelling.startsWith("-") ? unsigned : `-${unsigned}`;
    return new FrameInt(-this.data, NilContext, spelling);
  }

  protected override addSame(right: FrameNumeric): Frame {
    return new FrameInt(this.data + (right as FrameInt).data);
  }

  protected override subtractSame(right: FrameNumeric): Frame {
    return new FrameInt(this.data - (right as FrameInt).data);
  }

  protected override multiplySame(right: FrameNumeric): Frame {
    return new FrameInt(this.data * (right as FrameInt).data);
  }

  protected override divideSame(_right: FrameNumeric): Frame {
    return Frame.error("$!.numeric-internal / FrameInt");
  }

  protected override moduloSame(right: FrameNumeric): Frame {
    const divisor = (right as FrameInt).data;
    const remainder = this.data % divisor;
    return new FrameInt(
      remainder !== 0n && (remainder < 0n) !== (divisor < 0n)
        ? remainder + divisor
        : remainder,
    );
  }

  protected override powerSame(right: FrameNumeric): Frame {
    const exponent = (right as FrameInt).data;
    return this.powerIntegral(exponent);
  }

  protected override powerIntegral(exponent: bigint): Frame {
    if (exponent < 0n) {
      return Frame.error("$!.numeric-internal ** FrameInt");
    }
    if (!exactPowerWithinLimit([this.data], exponent)) {
      return Frame.error("$!.numeric-range ** FrameInt");
    }
    return new FrameInt(exactBigIntPower(this.data, exponent));
  }

  protected override compareSame(right: FrameNumeric): -1 | 0 | 1 {
    const value = (right as FrameInt).data;
    return this.data < value ? -1 : this.data > value ? 1 : 0;
  }

  protected override repeat(argument: Frame, parameter: Frame): Frame {
    const count = this.repetitionCount();
    if (count instanceof Frame) return count;

    if (
      hasCharacterContent(argument) &&
      BigInt(argument.characterContent().length) * this.data >
        REPETITION_TEXT_LIMIT
    ) {
      return Frame.error(`$!.repetition-size ${REPETITION_TEXT_LIMIT}`);
    }

    let result = Frame.nil;
    for (let index = 0; index < count; index += 1) {
      result = result.apply(argument, parameter);
    }
    return result;
  }
}
