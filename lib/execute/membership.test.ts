import { expect } from "jsr:@std/expect@^0.219.1";
import { FrameHandle } from "../frames/frame-handle.ts";
import { evaluate } from "./evaluate.ts";
import {
  Frame,
  FrameArray,
  FrameGroup,
  FrameInt,
  FrameLazy,
  FrameString,
  FrameType,
} from "../frames.ts";
import { HasType } from "../ops/type-operations.ts";
import { IdenticalMember, Member, TypedMember } from "../ops/membership.ts";

Deno.test("membership uses the original equality ladder, including atom identity", () => {
  const item = new FrameArray([]);
  const copy = new FrameArray([]);
  const host = new FrameArray([item, item]);
  for (
    const [op, same] of [
      [Member, (a: Frame, b: Frame) => a.equals(b)],
      [TypedMember, (a: Frame, b: Frame) => a.typeEquals(b)],
      [IdenticalMember, (a: Frame, b: Frame) => a.identical(b)],
    ] as const
  ) {
    expect(op(item, host)).toBe(Frame.all);
    expect(op(copy, host)).toBe(same(copy, item));
    expect(op(item, new FrameArray([]))).toBe(Frame.nil);
    expect(op(item, new FrameArray([host]))).toBe(Frame.nil);
    expect(op(item, new FrameString("[]"))).toBe(Frame.nil);
    expect(op(item, item)).toBe(Frame.nil);
  }
  const a = new FrameInt("2");
  const b = new FrameInt("2");
  expect(IdenticalMember(a, new FrameArray([b]))).toBe(Frame.all);
});

Deno.test("native membership parses tight and spaced operators with HC application precedence", () => {
  const yes = [
    "[]~[[]]",
    "[] ~~ [[]]",
    "2 ~ [5 - 3]",
    "2 ~~ [2]",
    "2 ~~~ [2]",
    "1 ~ (0, 1)",
    "1 ~ [0, 1] ? {<>} : {()}",
    "(1 ~ [0, 1]) = <>",
    "(1 + 1) ~~ [2]",
    "1.~ [1]",
    ".point []; .line [point]; point ~~~ line",
    ".point []; .line [point, point]; point ~~~ line",
    ".x []; .host [.k 9; x]; x ~~~ host",
    "1 ~ <>",
    "[.x 1;] ~ <.x>",
    "0b101 ~ <3@Bit>",
    "0b10101 ~ <[.head <3@Bit>; .tail <[@Bit]>;]>",
    "“Q” ~ “”.<>",
    "2 ~~ <2>",
  ];
  const no = [
    "[] ~ []",
    "[] ~ [[[]]]",
    "[] ~~~ [[]]",
    "2 ~~ [5 - 3]",
    "2 ~~~ [5 - 3]",
    "2 ~ [3]",
    "1 ~ 1",
    "“a” ~ “a”",
    "1 ~ [.k 1;]",
    "1 ~ [.^ [1];]",
    "2 ~ ()",
    "0b10 ~ <3@Bit>",
    "“Q” ~ 1.<>",
    "1 ~~~ 1.<>",
  ];
  for (const source of yes) {
    const result = evaluate(`{${source}} ()`);
    expect(result.at(0), source).toBe(Frame.all);
  }
  for (const source of no) {
    expect(evaluate(`{${source}} ()`).toString(), source).toEqual("[]");
  }
});

Deno.test("membership excludes metadata, and groups and closures use their native element view", () => {
  const item = new FrameArray([]);
  const parent = new FrameArray([item]);
  const host = new FrameArray([], { hidden: item });
  host.parent = parent;
  for (const op of [Member, TypedMember, IdenticalMember]) {
    expect(op(item, host)).toBe(Frame.nil);
    expect(op(item, new FrameGroup([item]))).toBe(Frame.all);
    expect(op(item, new FrameHandle(new FrameArray([item]), false)))
      .toBe(Frame.all);
    expect(op(new FrameHandle(item, false), new FrameArray([item])))
      .toBe(Frame.all);
  }
  // Walking a closure yields words rather than evaluating body lookups.
  expect(evaluate("{.f {unbound + 1}; 1 ~~ f} ()").at(0)).toBe(Frame.all);
  expect(evaluate("{.f {unbound}; “unbound” ~ f} ()").toString()).toEqual("[]");
});

Deno.test("type accessor extracts the runtime referent, including named and closure values", () => {
  for (
    const [source, representative] of [
      ["“”.<>", new FrameString("")],
      [".s “text”; s.<>", new FrameString("")],
      ["[].<>", new FrameArray([])],
      [".x []; x.<>", new FrameArray([])],
      ["{}.<>", new FrameLazy([])],
      [".f {missing}; f.<>", new FrameLazy([])],
      [".x <1, 2> 1; x.<>", evaluate("1").at(0)],
      ["(5 - 3).<>", new FrameInt("2")],
    ] as const
  ) {
    const result = evaluate(`{${source}} ()`).at(0);
    expect(result, source).toBeInstanceOf(FrameType);
    expect((result as FrameType).matches(representative), source).toBe(true);
  }
  expect(evaluate("{.x <1,2> 1; x.<^>} ()").at(0).toString())
    .toContain("<1, 2>");
  expect(evaluate("2 ~~ [2]").at(0)).toBe(Frame.all);
  expect(evaluate("~~2").at(0)).not.toBeInstanceOf(FrameType);
});

Deno.test("named and handled candidates retain nested schema acceptance and rejection", () => {
  for (
    const [schemaSource, accepted, rejected] of [
      ["<<[1, 2]>>", "[1, 2]", "[1, 3]"],
      ["<<.x>>", "[.x 1;]", "[.y 1;]"],
      ["<[].<>>", "[]", "“wrong type”"],
    ]
  ) {
    const schema = evaluate(schemaSource).at(0);
    for (
      const [source, expected] of [
        [accepted, Frame.all],
        [rejected, Frame.nil],
      ] as const
    ) {
      const value = evaluate(source).at(0);
      for (const mutable of [false, true]) {
        const candidate = new FrameHandle(value, mutable);
        // Compare transparent membership with the established raw-value
        // matcher predicate, including its nested rejection paths.
        expect(HasType(value, schema), schemaSource).toBe(expected);
        expect(Member(candidate, schema), schemaSource).toBe(expected);
        expect(Member(candidate, new FrameHandle(schema, false)), schemaSource)
          .toBe(expected);
      }
    }
    const source = `{.Allowed ${schemaSource}; .good ${accepted};
      .bad ${rejected}; [good ~ Allowed, bad ~ Allowed]} ()`;
    expect(evaluate(source).at(0).toString(), source).toEqual("[<>, ()]");
  }
});

Deno.test("distinct Fano points exercise the complete membership ladder in HC", () => {
  const source = `{.p []; .q []; .line [p];
    [q ~ line, q ~~ line, q ~~~ line, p ~~~ line]} ()`;
  expect(evaluate(source).at(0).toString()).toEqual("[<>, <>, (), <>]");
});
