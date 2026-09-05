import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameDecimal,
  FrameInt,
  FrameNumber,
  FrameNumeric,
  FrameRational,
  FrameSequence,
  FrameString,
} from "../frames.ts";
import { Add } from "../ops/math.ts";

describe("exact numeric frames", () => {
  it("constructs bigint integers without retaining parsed spellings", () => {
    const source = "0012345678901234567890";
    const value = FrameInt.for(source);

    expect(value.data).toEqual(12345678901234567890n);
    expect(value.toString()).toEqual(source);
    expect(FrameInt.for(source)).not.toBe(value);
  });

  it("stores decimal numerator and scale and pads synthesized decimals", () => {
    const source = new FrameDecimal("003.040");

    expect(source.numerator).toEqual(3040n);
    expect(source.scale).toEqual(3);
    expect(source.toString()).toEqual("003.040");
    expect(FrameDecimal.fromParts(1n, 2).toString()).toEqual("0.01");
  });

  it("stores immutable sequence spelling and absorbs numeric lookups", () => {
    const sequence = new FrameSequence("1.408.055");
    const extended = sequence.get("1212");

    expect(Object.isFrozen(sequence.segments)).toEqual(true);
    expect(extended).toBeInstanceOf(FrameSequence);
    expect(extended.toString()).toEqual("1.408.055.1212");
  });

  it("normalizes rational signs and common factors and collapses denominator one", () => {
    const normalized = new FrameRational(-2n, -4n);
    const collapsed = FrameRational.create(6n, 3n);

    expect(normalized.numerator).toEqual(1n);
    expect(normalized.denominator).toEqual(2n);
    expect(normalized.toString()).toEqual("1/2");
    expect(collapsed).toBeInstanceOf(FrameInt);
    expect(collapsed.toString()).toEqual("2");
  });
});

describe("numeric tower", () => {
  it("keeps bigint arithmetic exact beyond MAX_SAFE_INTEGER", () => {
    expect(
      new FrameInt(12345678901234567890n).add(new FrameInt(1n)).toString(),
    ).toEqual("12345678901234567891");
  });

  it("aligns decimal scales exactly", () => {
    const result = new FrameDecimal("1.10").add(new FrameDecimal("2.2"));

    expect(result).toBeInstanceOf(FrameDecimal);
    expect(result.toString()).toEqual("3.30");
  });

  it("promotes by rank for addition, subtraction, and multiplication", () => {
    expect(new FrameInt(2n).add(new FrameDecimal("1.5")))
      .toBeInstanceOf(FrameDecimal);
    expect(
      new FrameDecimal("1.5").add(new FrameRational(1n, 2n)).toString(),
    ).toEqual("2");
    expect(new FrameRational(1n, 2n).multiply(new FrameNumber(2)))
      .toBeInstanceOf(FrameNumber);
    expect(new FrameDecimal("4.5").subtract(new FrameInt(2n)).toString())
      .toEqual("2.5");
  });

  it("routes juxtaposed numeric application through multiplication", () => {
    expect(new FrameInt(3n).apply(new FrameInt(2n), Frame.nil).toString())
      .toEqual("6");
    expect(
      new FrameDecimal("1.5").apply(new FrameInt(2n), Frame.nil).toString(),
    ).toEqual("3.0");
  });

  it("selects exact or inexact division from the divisor rung", () => {
    const ratio = new FrameInt(3n).divide(new FrameInt(2n));
    const collapsed = new FrameInt(4n).divide(new FrameInt(2n));
    const decimalDivisor = new FrameInt(1n).divide(new FrameDecimal("2.0"));
    const exactDecimal = new FrameDecimal("10.50").divide(new FrameInt(2n));

    expect(ratio).toBeInstanceOf(FrameRational);
    expect(ratio.toString()).toEqual("3/2");
    expect(collapsed).toBeInstanceOf(FrameInt);
    expect(collapsed.toString()).toEqual("2");
    expect(decimalDivisor).toBeInstanceOf(FrameNumber);
    expect(decimalDivisor.toString()).toEqual("0.5");
    expect(exactDecimal.toString()).toEqual("21/4");
  });

  it("returns stable division and modulo errors", () => {
    expect(new FrameInt(1n).divide(new FrameInt(0n)).toString())
      .toEqual("$!.division-by-zero /");
    expect(new FrameInt(1n).modulo(new FrameInt(0n)).toString())
      .toEqual("$!.modulo-by-zero %%");
    expect(new FrameDecimal("1.0").modulo(new FrameInt(1n)).toString())
      .toEqual("$!.numeric-domain %% FrameDecimal FrameInt");
  });

  it("keeps integral powers exact and fractional powers inexact", () => {
    expect(new FrameInt(2n).power(new FrameInt(64n)).toString())
      .toEqual("18446744073709551616");
    expect(new FrameInt(2n).power(new FrameInt(-1n)).toString())
      .toEqual("1/2");
    expect(new FrameInt(2n).power(new FrameDecimal("1.5")))
      .toBeInstanceOf(FrameNumber);
    expect(new FrameInt(0n).power(new FrameInt(-1n)).toString())
      .toEqual("$!.division-by-zero **");
  });

  it("compares exact values across rungs and floats only with FrameNumber", () => {
    const integer = new FrameInt(3n);
    const decimal = new FrameDecimal("3.0");
    const rational = new FrameRational(6n, 2n);

    expect(integer.equals(decimal)).toBe(Frame.all);
    expect(decimal.equals(rational)).toBe(Frame.all);
    expect(new FrameRational(1n, 3n).lessThan(new FrameDecimal("0.34")))
      .toBe(Frame.all);
    expect(integer.equals(new FrameNumber(3))).toBe(Frame.all);
  });

  it("leaves data and metadata equality unchanged", () => {
    const integer = new FrameInt(3n);
    const decimal = new FrameDecimal("3.0");

    expect(integer.dataEquals(decimal)).toBe(Frame.nil);
    expect(integer.metadataEquals(decimal)).toBe(Frame.all);
  });

  it("projects huge finite rational ratios without Infinity over Infinity", () => {
    const numerator = 10n ** 400n + 1n;
    const denominator = 10n ** 399n + 1n;
    const projected = new FrameRational(numerator, denominator).valueOf();

    const tiny = new FrameRational(1n, 10n ** 309n).valueOf();

    expect(Number.isFinite(projected)).toEqual(true);
    expect(projected).toBeCloseTo(10);
    expect(tiny).toEqual(1e-309);
  });
});

describe("numeric domains", () => {
  it("compares identical sequences structurally and sequences to numbers as nil", () => {
    const left = new FrameSequence("1.408.055.1212");
    const same = new FrameSequence("1.408.055.1212");
    const other = new FrameSequence("1.408.555.1212");

    expect(left.equals(same)).toBe(Frame.all);
    expect(new FrameSequence("+1.408.055.1212").equals(left)).toBe(Frame.all);
    expect(left.equals(other)).toBe(Frame.nil);
    expect(left.equals(new FrameInt(1n))).toBe(Frame.nil);
  });

  it("rejects sequence arithmetic, ordering, signs, and repetition stably", () => {
    const sequence = new FrameSequence("1.408.055");

    expect(sequence.add(new FrameInt(1n)).toString())
      .toEqual("$!.numeric-domain + FrameSequence FrameInt");
    expect(sequence.lessThan(new FrameInt(1n)).toString())
      .toEqual("$!.numeric-domain < FrameSequence FrameInt");
    expect(sequence.apply(new FrameString("x"), Frame.nil).toString())
      .toEqual("$!.repetition-domain FrameSequence");
  });

  it("preserves nil for arbitrary nonnumeric operator mismatches", () => {
    expect(Add(new FrameInt(1n), new FrameString("x"))).toBe(Frame.nil);
  });

  it("exposes exactInt only for exact integer representations", () => {
    expect(new FrameInt(3n).exactInt()).toEqual(3n);
    expect(FrameDecimal.fromParts(3n, 0).exactInt()).toEqual(3n);
    expect(new FrameDecimal("3.0").exactInt()).toBeInstanceOf(Frame);
    expect(new FrameRational(3n, 2n).exactInt()).toBeInstanceOf(Frame);
    expect(new FrameNumber(3).exactInt()).toBeInstanceOf(Frame);
  });

  it("bounds repetition work and text output without host exceptions", () => {
    const maximum = new FrameInt(65_536n).range();
    const tooLarge = new FrameInt(65_537n).range();
    const oversizedText = new FrameInt(65_536n).apply(
      new FrameString("0123456789abcdef"),
      Frame.nil,
    );
    const decimal = new FrameDecimal("3.0").apply(
      new FrameString("x"),
      Frame.nil,
    );

    expect(maximum).toBeInstanceOf(Array);
    expect((maximum as number[]).length).toEqual(65_536);
    expect(tooLarge.toString()).toEqual("$!.repetition-limit 65536");
    expect(oversizedText.toString()).toEqual("$!.repetition-size 1000000");
    expect(new FrameInt(3n).apply(new FrameString("x"), Frame.nil).toString())
      .toEqual("“xxx”");
    expect(decimal.toString()).toEqual("$!.repetition-domain FrameDecimal");
  });
});

describe("numeric behavior matrices", () => {
  const leftValues: FrameNumeric[] = [
    new FrameInt(2n),
    new FrameDecimal("1.5"),
    new FrameRational(1n, 3n),
    new FrameNumber(0.25),
  ];
  const rightValues: FrameNumeric[] = [
    new FrameInt(1n),
    new FrameDecimal("0.2"),
    new FrameRational(1n, 5n),
    new FrameNumber(0.1),
  ];
  const rungNames = [
    "FrameInt",
    "FrameDecimal",
    "FrameRational",
    "FrameNumber",
  ];

  for (
    const [operator, operate] of [
      ["+", (left: FrameNumeric, right: FrameNumeric) => left.add(right)],
      ["-", (left: FrameNumeric, right: FrameNumeric) => left.subtract(right)],
      ["*", (left: FrameNumeric, right: FrameNumeric) => left.multiply(right)],
    ] as const
  ) {
    it(`joins every ${operator} operand pair at the highest rank`, () => {
      leftValues.forEach((left, leftRank) => {
        rightValues.forEach((right, rightRank) => {
          expect(operate(left, right).className()).toEqual(
            rungNames[Math.max(leftRank, rightRank)],
          );
        });
      });
    });
  }

  it("selects every division result from the divisor rung", () => {
    const dividends: FrameNumeric[] = [
      new FrameInt(3n),
      new FrameDecimal("1.5"),
      new FrameRational(1n, 3n),
      new FrameNumber(1.25),
    ];
    const divisors: FrameNumeric[] = [
      new FrameInt(2n),
      new FrameDecimal("2.0"),
      new FrameRational(2n, 3n),
      new FrameNumber(2),
    ];
    const expected = [
      ["FrameRational", "FrameNumber", "FrameRational", "FrameNumber"],
      ["FrameRational", "FrameNumber", "FrameRational", "FrameNumber"],
      ["FrameRational", "FrameNumber", "FrameRational", "FrameNumber"],
      ["FrameNumber", "FrameNumber", "FrameNumber", "FrameNumber"],
    ];

    dividends.forEach((left, leftRank) => {
      divisors.forEach((right, rightRank) => {
        expect(left.divide(right).className()).toEqual(
          expected[leftRank][rightRank],
        );
      });
    });
  });

  it("compares equal values across every numeric rank", () => {
    const threes: FrameNumeric[] = [
      new FrameInt(3n),
      new FrameDecimal("3.0"),
      new FrameRational(6n, 2n),
      new FrameNumber(3),
    ];

    threes.forEach((left) => {
      threes.forEach((right) => {
        expect(left.equals(right)).toBe(Frame.all);
        expect(left.lessThanOrEqual(right)).toBe(Frame.all);
        expect(left.greaterThanOrEqual(right)).toBe(Frame.all);
        expect(left.lessThan(right)).toBe(Frame.nil);
        expect(left.greaterThan(right)).toBe(Frame.nil);
      });
    });
  });

  it("keeps finite decimal quotients finite at extreme scales", () => {
    const huge = new FrameDecimal(`1${"0".repeat(400)}.0`);
    const large = new FrameDecimal(`1${"0".repeat(399)}.0`);
    const tiny = new FrameDecimal(`0.${"0".repeat(399)}1`);
    const lessTiny = new FrameDecimal(`0.${"0".repeat(398)}1`);

    expect(huge.divide(large).toString()).toEqual("10");
    expect(tiny.divide(lessTiny).toString()).toEqual("0.1");
    expect(new FrameDecimal("0.3").divide(new FrameDecimal("0.1")).toString())
      .toEqual("2.9999999999999996");
  });

  it("bounds exact exponentiation before allocating unbounded bigints", () => {
    const exponent = new FrameInt(1_000_000n);

    expect(new FrameInt(2n).power(exponent).toString())
      .toEqual("$!.numeric-range ** FrameInt");
    expect(new FrameInt(3n).power(new FrameInt(999_999n)).toString())
      .toEqual("$!.numeric-range ** FrameInt");
    expect(new FrameDecimal("2.0").power(exponent).toString())
      .toEqual("$!.numeric-range ** FrameDecimal");
    expect(new FrameRational(2n, 3n).power(exponent).toString())
      .toEqual("$!.numeric-range ** FrameRational");
  });
});
