import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

// Native .# counts immediate elements; .## counts structural terminals.
const shapes = [
  ["[]", "0", "1"],
  ["[[]]", "1", "1"],
  ["[[], []]", "2", "2"],
  ["[[], [[], []]]", "2", "3"],
  ["[[[], []], [[], [], []]]", "2", "5"],
] as const;

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  return session;
}

Deno.test("native sizes distinguish immediate elements from structural terminals", async () => {
  const session = await figuresSession();
  for (const [frame, elements, terminals] of shapes) {
    expect(await session.call(`${frame}.#`)).toEqual(elements);
    expect(await session.call(`${frame}.##`)).toEqual(terminals);
  }
});

Deno.test("Figures exports no wrappers for native construction and observation", async () => {
  const session = await figuresSession();
  for (
    const name of [
      "pure",
      "need",
      "withness",
      "Figure",
      "A",
      "B",
      "Z",
      "U",
      "form",
      "size",
      "count",
      "cells",
      "many",
      "mul",
      "sameform",
      "sameness",
      "size_equivalent",
      "inlay",
    ]
  ) {
    expect(await session.call(`Figures.${name}`), name)
      .toContain("$!.name-missing");
  }
});

Deno.test("native equality, identity and repetition replace Figure wrappers", async () => {
  const session = await figuresSession();
  await session.call(".a []; .b [[]]; .x [a, b]; .y [[], []];");
  for (
    const [source, expected] of [
      ["x = [[], [[]]]", "<>"],
      ["x === [a, b]", ""],
      ["(x .0) === a", "<>"],
      ["x.## = y.##", "<>"],
      ["(x.## [y]).##", "4"],
      ["(x & {[[]]}).#", "2"],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("native single and collective incidence compare immediate identity", async () => {
  const session = await figuresSession();
  await session.call(".shared [[]]; .p1 [shared, []]; .p2 [[], shared];");
  for (
    const [source, expected] of [
      ["shared ~~~ p1", "<>"],
      ["shared ~~~ p2", "<>"],
      ["[[]] ~~~ p1", ""],
      ["[[]] ~~~ []", ""],
      ["([] &| {.f _; (f ~~~ [shared]) ? {[]} : {[f]}}) = []", "<>"],
      [
        "([shared, shared] &| {.f _; (f ~~~ [shared]) ? {[]} : {[f]}}) = []",
        "<>",
      ],
      ["([shared] &| {.f _; (f ~~~ [[shared]]) ? {[]} : {[f]}}) = []", ""],
      ["([shared, (p1 .1)] &| {.f _; (f ~~~ p1) ? {[]} : {[f]}}) = []", "<>"],
      [
        "([shared, []] &| {.f _; (f ~~~ [shared, shared]) ? {[]} : {[f]}}) = []",
        "",
      ],
      ["([shared, [[]]] &| {.f _; (f ~~~ p1) ? {[]} : {[f]}}) = []", ""],
      ["([2, 2] &| {.f _; (f ~~~ [2]) ? {[]} : {[f]}}) = []", "<>"],
      ["([(2 - 0)] &| {.f _; (f ~~~ [2]) ? {[]} : {[f]}}) = []", ""],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("native Star and .## support mixed count/array trees", async () => {
  const session = await figuresSession();
  expect(await session.call("[1, [2, []]].##")).toEqual("4");
  expect(await session.call("[[], 5, [[], “ab”]].##")).toEqual("9");
  expect(await session.call("([1, [2, []]] * []).##")).toEqual("4");
});

Deno.test("Star terminal product law uses native .## across 25 pairs", async () => {
  const session = await figuresSession();
  for (const [x, , m] of shapes) {
    for (const [y, , n] of shapes) {
      expect(await session.call(`(${x} * ${y}).##`), `${x}, ${y}`)
        .toEqual(String(Number(m) * Number(n)));
    }
  }
});

Deno.test("Gap is |.###| and Spin is .### / N, with .### a FrameInt (010.04)", async () => {
  const session = await figuresSession();
  const residuals = [
    ["[]", "0"],
    ["[[]]", "1"],
    ["[[], []]", "0"],
    ["[[], [[], []]]", "-1"],
    ["[[[], []], []]", "1"],
    ["[[], [[], []], [[], [], []]]", "2"],
    ["[[[], []], [[], [], [], [], []]]", "-3"],
  ] as const;
  for (const [x, s] of residuals) {
    expect(await session.call(`${x}.###`), x).toEqual(s);
    // `==` compares the exact type, and a FrameInt is what `-` answers.
    expect(await session.call(`(${x}.###) == (${s} - 0)`), x).toEqual("<>");
    const gap = s.startsWith("-") ? s.slice(1) : s;
    expect(await session.call(`(Figures.gap ${x}) == (${gap} - 0)`), x)
      .toEqual("<>");
    expect(await session.call(`(Figures.spin ${x} 4) = (${x}.### / 4)`), x)
      .toEqual("<>");
  }
  // A negative residual keeps its sign in Spin and loses it in Gap.
  expect(await session.call("Figures.spin [[], [[], []]] 2")).toEqual("-1/2");
  expect(await session.call("Figures.gap [[], [[], []]]")).toEqual("1");
});

Deno.test("Gap and Spin keep refusing unsupported hosts (010.04)", async () => {
  const session = await figuresSession();
  for (const host of ["“hi”", "(-3)"]) {
    expect(await session.call(`Figures.gap ${host}`), host)
      .toContain("unsupported-figure");
    expect(await session.call(`Figures.spin ${host} 2`), host)
      .toContain("unsupported-figure");
    // nil prints as the empty string.
    expect(await session.call(`${host}.###`), host).toEqual("");
  }
});

Deno.test("Figure observations ignore metadata and Star preserves it (010.04)", async () => {
  const session = await figuresSession();
  await session.call(".p [.k 1; [], [.j 2; []]]; .q (p * [[]]);");
  for (
    const [source, expected] of [
      ["p.### ? {<>} : {()}", "<>"],
      ["(p.### ? {p} : {unsupported-figure}) === p", "<>"],
      ["p.###", "0"],
      ["Figures.gap [.k 1; [[], []]]", "2"],
      ["Figures.spin [.k 1; [], [[], []]] 2", "-1/2"],
      // Star preserves ancestor metadata and leaves the host unchanged.
      ["q = [.k 1; [[]], [.j 2; [[]]]]", "<>"],
      ["(q .1) = [.j 2; [[]]]", "<>"],
      ["p.k", "1"],
      ["p = [.k 1; [], [.j 2; []]]", "<>"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("parented Figures share the observer domain at every level", async () => {
  const session = await figuresSession();
  for (
    const host of [
      "[.^ [.m 9]; .k 1; [], [[], []]]",
      "[[], [.^ [.m 9]; .k 1; [], []]]",
    ]
  ) {
    await session.call(`.host ${host};`);
    for (
      const source of [
        "host.### ? {<>} : {()}",
        "(host.### ? {host} : {unsupported-figure}) === host",
        "host.### == (0 - 1)",
        "host.## = 3",
        "(Figures.gap host) == (1 - 0)",
        "(Figures.spin host 2) = (0 - (1 / 2))",
        `(host = ${host})`,
      ]
    ) {
      expect(await session.call(source), source).toEqual("<>");
    }
  }
  await session.call(
    ".parent [.m 9]; .child [.^ parent; .k 2; []]; " +
      ".host [.^ parent; .k 1; child, []]; " +
      ".y [[]]; .result (host * y);",
  );
  for (
    const source of [
      "result.k = 1",
      "(result .0).k = 2",
      "result.m = 9",
      "(result .0).m = 9",
      "((result .0) .0) === y",
      "(result .1) === y",
      "(result === host) = ()",
      "(host .0) === child",
      "(host .1) = []",
      "host.m = 9",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("native residual availability distinguishes valid zero from unsupported hosts", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      ["[5, “hello”].###", "0"],
      ["[5, “hello”].### ? {<>} : {()}", "<>"],
      ["([5, “hello”].###) == (0 - 0)", "<>"],
      ["5.### ? {<>} : {()}", "<>"],
      ["<2, 3>.###", ""],
      ["{[]}.###", "1"],
      ["[].##", "1"],
      ["[].###", "0"],
      ["Figures.gap [5, “hello”]", "0"],
      ["Figures.spin [5, “hello”] 4", "0"],
      ["Figures.gap (5, 3)", "2"],
      ["Figures.spin (3, 5) 4", "-1/2"],
      ["{.x <[].<>> _; x.###} [[], [“nested atom”]]", "-10"],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  // An outer array type checks neither descendants nor the full residual domain.
  expect(await session.call("{.x <[].<>> _; x.###} (5, 3)"))
    .toContain("$!.type-error");
  expect(await session.call("[[], [“nested atom”]] * [[]]"))
    .toContain("$!.star-domain");
  expect(await session.call("(5, 3) * [[]]"))
    .toContain("$!.star-domain");
  expect(await session.call("5.### ? {5} : {unsupported-figure}"))
    .toEqual("5");
});

Deno.test("derived Gap and Spin preserve refusal and resolution typing at zero", async () => {
  const session = await figuresSession();
  for (const host of ["[]", "[5, “hello”]", "[3, 5]"]) {
    expect(await session.call(`Figures.spin ${host} 0`), host)
      .toEqual("$!.division-by-zero /");
    for (
      const divisor of [
        "(0 - 2)",
        "(2 - 0)",
        "2.5",
        "(1 / 2)",
        "“2”",
        "[]",
        "<>",
      ]
    ) {
      expect(
        await session.call(`Figures.spin ${host} ${divisor}`),
        `${host}, ${divisor}`,
      )
        .toContain("$!.type-error");
    }
  }
  for (const host of ["“hi”", "(-3)"]) {
    for (const divisor of ["0", "(0 - 2)", "2.5"]) {
      expect(await session.call(`Figures.spin ${host} ${divisor}`), host)
        .toContain("unsupported-figure");
    }
    expect(await session.call(`Figures.gap ${host}`), host)
      .toContain("unsupported-figure");
  }
  // Concrete reasons to retain the two derived definitions: Size changes
  // Gap's type and accepts nil; bare division accepts non-Count resolutions.
  for (
    const [source, expected] of [
      ["([3, 5].###).## == (Figures.gap [3, 5])", ""],
      ["(5.###).##", "1"],
      ["(5.###) / 2", "1/2"],
      ["([3, 5].###) / (0 - 2)", "1"],
      ["([3, 5].###) / 2.5", "-0.8"],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});
