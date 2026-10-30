import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameCount,
  FrameDecimal,
  FrameInt,
  FrameNumber,
  type FrameNumeric,
  FrameRational,
  FrameResource,
  FrameType,
  MemoryStore,
  NUMERIC_RANK,
  RESOURCE_ROOT_KEY,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";
import { make_context } from "../execute/hc-eval.ts";

/** The value the first statement of `source` evaluates to. */
const value = (source: string): Frame => evaluate(source).at(0);

const count = (data: bigint): FrameCount => new FrameCount(data);
const int = (data: bigint): FrameInt => new FrameInt(data);

/** Asserts the class exactly, since every count is also a FrameInt. */
const expectClass = (frame: Frame, name: string): void => {
  expect(frame.className()).toEqual(name);
};

describe("FrameCount", () => {
  describe("literals", () => {
    it("is the value of every nonnegative integer literal", () => {
      for (const source of ["0", "1234567890", "007", "+5"]) {
        const literal = value(source);

        expect(literal).toBeInstanceOf(FrameCount);
        expect(literal.toString()).toEqual(source);
      }
    });

    it("leaves a negative literal a FrameInt, -0 included", () => {
      for (const source of ["-1", "-0", "-1234567890"]) {
        const literal = value(source);

        expectClass(literal, "FrameInt");
        expect(literal.toString()).toEqual(source);
      }
    });

    it("leaves decimal, rational, and inexact values on their own rungs", () => {
      expectClass(value("0.5"), "FrameDecimal");
      expectClass(value("1 / 3"), "FrameRational");
      expectClass(value("1 / 2.0"), "FrameNumber");
    });

    it("is the root rung, an integer, and prints as one", () => {
      const zero = count(0n);

      expect(zero.rank).toEqual(NUMERIC_RANK.count);
      expect(NUMERIC_RANK.count).toBeLessThan(NUMERIC_RANK.int);
      expect(zero).toBeInstanceOf(FrameInt);
      expect(zero.className()).toEqual("FrameCount");
      expect(zero.toString()).toEqual(int(0n).toString());
      expect(count(1234567890n).toString()).toEqual("1234567890");
    });

    it("refuses a negative value or spelling at construction", () => {
      expect(() => count(-1n)).toThrow(RangeError);
      expect(() => FrameCount.for("-0")).toThrow(RangeError);
    });
  });

  describe("arithmetic", () => {
    it("stays a count under +, *, juxtaposition, %%, and nonnegative **", () => {
      const results: [Frame, string][] = [
        [count(2n).add(count(3n)), "5"],
        [count(2n).multiply(count(3n)), "6"],
        [count(3n).apply(count(2n), Frame.nil), "6"],
        [count(7n).modulo(count(3n)), "1"],
        [count(2n).power(count(10n)), "1024"],
        [count(2n).power(count(0n)), "1"],
        [count(2n).power(int(3n)), "8"],
      ];

      for (const [result, expected] of results) {
        expectClass(result, "FrameCount");
        expect(result.toString()).toEqual(expected);
      }
    });

    it("answers FrameInt for subtraction, even when the result is nonnegative", () => {
      for (
        const [left, right, expected] of [
          [5n, 3n, "2"],
          [3n, 3n, "0"],
          [3n, 5n, "-2"],
        ] as const
      ) {
        const difference = count(left).subtract(count(right));

        expectClass(difference, "FrameInt");
        expect(difference.toString()).toEqual(expected);
      }
    });

    it("answers FrameInt for unary negation and a count for unary plus", () => {
      expectClass(value("-(2 + 3)"), "FrameInt");
      expect(value("-(2 + 3)").toString()).toEqual("-5");
      expectClass(value("-(0)"), "FrameInt");
      expectClass(value("+(2 + 3)"), "FrameCount");
      expect(value("+(2 + 3)").toString()).toEqual("+5");
    });

    it("answers a ratio for division, and FrameInt when the ratio is whole", () => {
      const ratio = count(7n).divide(count(2n));
      const whole = count(6n).divide(count(3n));

      expectClass(ratio, "FrameRational");
      expect(ratio.toString()).toEqual("7/2");
      // Matches FrameInt / FrameInt, whose whole quotient collapses the same way.
      expectClass(whole, "FrameInt");
      expectClass(int(6n).divide(int(3n)), "FrameInt");
      expect(whole.toString()).toEqual("2");
      expectClass(count(0n).divide(count(3n)), "FrameInt");
    });

    it("answers a ratio for a negative integral power", () => {
      const reciprocal = count(2n).power(int(-1n));

      expectClass(reciprocal, "FrameRational");
      expect(reciprocal.toString()).toEqual("1/2");
    });

    it("keeps the existing zero, domain, and range errors", () => {
      expect(count(1n).divide(count(0n)).toString())
        .toEqual("$!.division-by-zero /");
      expect(count(1n).modulo(count(0n)).toString())
        .toEqual("$!.modulo-by-zero %%");
      expect(count(1n).modulo(int(0n)).toString())
        .toEqual("$!.modulo-by-zero %%");
      expect(count(0n).power(int(-1n)).toString())
        .toEqual("$!.division-by-zero **");
      expect(new FrameDecimal("1.0").modulo(count(1n)).toString())
        .toEqual("$!.numeric-domain %% FrameDecimal FrameCount");
      expect(count(2n).power(count(1_000_000n)).toString())
        .toEqual("$!.numeric-range ** FrameCount");
    });
  });

  describe("promotion", () => {
    it("joins a FrameInt operand at the FrameInt rung", () => {
      const results: [Frame, string][] = [
        [count(2n).add(int(-3n)), "-1"],
        [int(-3n).add(count(2n)), "-1"],
        [count(2n).add(int(3n)), "5"],
        [count(2n).multiply(int(-3n)), "-6"],
        [count(7n).modulo(int(-3n)), "-2"],
        [int(-7n).modulo(count(3n)), "2"],
      ];

      for (const [result, expected] of results) {
        expectClass(result, "FrameInt");
        expect(result.toString()).toEqual(expected);
      }
    });

    it("follows the ladder for +, -, and * against every rung", () => {
      const rungs: [FrameNumeric, string][] = [
        [count(2n), "FrameCount"],
        [int(2n), "FrameInt"],
        [new FrameDecimal("1.5"), "FrameDecimal"],
        [new FrameRational(1n, 7n), "FrameRational"],
        [new FrameNumber(0.25), "FrameNumber"],
      ];

      for (const [right, name] of rungs) {
        expectClass(count(3n).add(right), name);
        expectClass(right.add(count(3n)), name);
        expectClass(count(3n).multiply(right), name);
        expectClass(
          count(3n).subtract(right),
          name === "FrameCount" ? "FrameInt" : name,
        );
      }
    });

    it("selects division from the divisor rung, as for FrameInt", () => {
      const divisors: [FrameNumeric, string][] = [
        [count(2n), "FrameRational"],
        [int(2n), "FrameRational"],
        [new FrameDecimal("2.0"), "FrameNumber"],
        [new FrameRational(2n, 3n), "FrameRational"],
        [new FrameNumber(2), "FrameNumber"],
      ];

      for (const [divisor, name] of divisors) {
        expectClass(count(3n).divide(divisor), name);
        expectClass(int(3n).divide(divisor), name);
      }
    });
  });

  describe("comparison and equality", () => {
    it("compares by value against every rung", () => {
      const twos: FrameNumeric[] = [
        count(2n),
        int(2n),
        new FrameDecimal("2.0"),
        new FrameRational(4n, 2n),
        new FrameNumber(2),
      ];

      for (const two of twos) {
        expect(count(2n).equals(two)).toBe(Frame.all);
        expect(two.equals(count(2n))).toBe(Frame.all);
        expect(count(2n).lessThanOrEqual(two)).toBe(Frame.all);
        expect(count(1n).lessThan(two)).toBe(Frame.all);
        expect(count(3n).greaterThan(two)).toBe(Frame.all);
        expect(two.greaterThanOrEqual(count(2n))).toBe(Frame.all);
      }
      expect(int(-1n).lessThan(count(0n))).toBe(Frame.all);
      expect(count(0n).greaterThan(int(-1n))).toBe(Frame.all);
    });

    it("is `=` to a FrameInt of the same value, and ordered against every rung", () => {
      for (
        const source of [
          "2 = (5 - 3)",
          "(5 - 3) = 2",
          "[2] = [5 - 3]",
          "[.a 1; .b 2;] = [.a 1; .b (4 - 2);]",
          "2.< 2.5",
          "3.> (1 / 2)",
          "(0 - 1).< 0",
        ]
      ) {
        expect(value(source)).toBe(Frame.all);
      }
      // An enumeration schema matches by `=`, so it admits the FrameInt.
      expectClass(value("<1, 2, 3> (5 - 3)"), "FrameInt");
    });

    it("is a distinct type from FrameInt for ==, ===, and ~~", () => {
      for (
        const source of [
          "2 == (5 - 3)",
          "(5 - 3) == 2",
          "2 === (5 - 3)",
          "(5 - 3) === 2",
          "[2] == [5 - 3]",
          "[.a 1; .b 2;] == [.a 1; .b (4 - 2);]",
          "(5 - 3) ~ ~~2",
          "2 ~ ~~(5 - 3)",
          "5 ~ ~~(0 - 1)",
          "(0 - 1) ~ ~~5",
          // Exactly as a FrameInt and a FrameDecimal are.
          "2 == 2.0",
          "2 == (4 / 2.0)",
        ]
      ) {
        expect(evaluate(source).toString()).toEqual("[]");
      }
      expect(value("~~2 (5 - 3)").toString()).toEqual("$!.type-error ~~2 2");
      expect(value("~~(5 - 3) 2").toString()).toEqual("$!.type-error ~~2 2");
      expect(count(2n).typeEquals(int(2n))).toBe(Frame.nil);
      expect(int(2n).typeEquals(count(2n))).toBe(Frame.nil);
      expect(count(2n).identical(int(2n))).toBe(Frame.nil);
      expect(FrameType.of(count(2n)).matches(int(2n))).toBe(false);
      expect(FrameType.of(int(2n)).matches(count(2n))).toBe(false);
    });

    it("keeps ==, ===, and ~~ holding within one rung", () => {
      for (
        const source of [
          "2 == 2",
          "2 == (1 + 1)",
          "2 === (1 + 1)",
          "(0 - 2) == (0 - 2)",
          "(5 - 3) == (4 - 2)",
          "(5 - 3) === (4 - 2)",
          "3 ~ ~~2",
          "(0 - 5) ~ ~~(0 - 1)",
        ]
      ) {
        expect(value(source)).toBe(Frame.all);
      }
      expect(value("~~2 3").toString()).toEqual("3");
      expect(value("~~(0 - 1) (0 - 5)").toString()).toEqual("-5");
    });

    it("leaves the data plane comparing spellings", () => {
      expect(count(2n).dataEquals(int(2n))).toBe(Frame.all);
      expect(count(2n).dataEquals(new FrameInt("+2"))).toBe(Frame.nil);
    });
  });

  describe("size operators (#411)", () => {
    it("is its own size under .# and .##, not its digit length", () => {
      for (const digits of ["5", "12345"]) {
        for (const operator of [".#", ".##"]) {
          for (const source of [digits, `.n ${digits};\nn`]) {
            const size = evaluate(`${source}${operator}`).at(-1);

            expectClass(size, "FrameCount");
            expect(size.toString()).toEqual(digits);
          }
        }
      }
    });

    it("leaves every other numeric rung without a size", () => {
      for (const source of ["(5 - 3)", "(0 - 5)", "1.5", "(1 / 3)"]) {
        expect(evaluate(`${source}.#`).toString()).toEqual("[]");
        expect(evaluate(`${source}.##`).toString()).toEqual("[]");
      }
    });

    it("answers nil to .###, since a count is not a Figure (010.04)", () => {
      for (const source of ["5", "0", "(5 - 3)", "1.5"]) {
        expect(evaluate(`${source}.###`).toString()).toEqual("[]");
      }
    });
  });

  describe("counts the language answers", () => {
    it("answers a count for the characters a resource write wrote", () => {
      const written = evaluate("'./out.txt' “hello”", {
        [RESOURCE_ROOT_KEY]: FrameResource.root(new MemoryStore()),
      }).at(0);

      expectClass(written, "FrameCount");
      expect(written.toString()).toEqual("5");
    });

    it("answers a count for a host's decimal-digit value", () => {
      const host = make_context({ size: "3" });

      expectClass(host.size, "FrameCount");
      // Typed as the same digits in source are, so `==` holds against them.
      expect(evaluate("$$.size == 3", host).at(0)).toBe(Frame.all);
      expect(evaluate("($$.size - 3) == 0", host).toString()).toEqual("[]");
    });

    it("is accepted wherever an integer is", () => {
      expect(value("3“ab”").toString()).toEqual("“ababab”");
      expect(count(2n).range()).toEqual([0, 1]);
      expect(count(5n).exactInt()).toEqual(5n);
      expect(value("<8@Bit> 0xff").toString()).toEqual("0xff");
      expect(
        evaluate(".size (4 * 2);\n\\size\\01234567").at(-1).toString(),
      ).toEqual("\\8\\01234567");
    });
  });
});
