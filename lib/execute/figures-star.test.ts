import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

// Issue occurrence/figure 009.09: Figures are now ordinary native nested frames
// and the module keeps only derived Gap and Spin abbreviations. A cell/terminal is the
// empty frame `[]`; a nonempty array recurses over its elements. Star replaces
// each native terminal with the right operand, preserving nonterminal nesting,
// with no right-zero guard. These are focused unit tests, not a combinatorial
// oracle.

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  await session.call(
    ".gap {Figures.gap _}; .spin {Figures.spin _};",
  );
  return session;
}

Deno.test("Star replaces native terminals, preserving nonterminal nesting", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      // empty host: the empty frame is a single terminal, so it becomes y.
      ["([] * [[]]) = [[]]", "<>"],
      // singleton host wraps the replacement once.
      ["([[]] * [[], []]) = [[[], []]]", "<>"],
      // nested nonempty host: each terminal becomes y, nesting preserved.
      ["([[], [], [[], []]] * [[]]) = [[[]], [[]], [[[]], [[]]]]", "<>"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  // Count hosts expand structurally and now have parity residual.
  expect(await session.call("7.###")).toEqual("1");
});

Deno.test("Star with an empty replacement does not annihilate the host", async () => {
  const session = await figuresSession();
  for (
    const source of [
      // No right-zero guard: an empty y still replaces each terminal.
      "([[], []] * []) = [[], []]",
      "([[]] * []) = [[]]",
      "([[], []] * [[], []]) = [[[], []], [[], []]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("Star reuses the right operand by identity and leaves the host unchanged", async () => {
  const session = await figuresSession();
  await session.call(
    ".y [[], [[[]], []]]; .host [[], [[], []]]; .shared [[], []]; " +
      ".sharedhost [shared, shared]; .r (host * y); " +
      ".rs (sharedhost * y);",
  );
  for (
    const source of [
      // y is the very same frame at every terminal.
      "(r .0) === y",
      "((r .1) .0) === y",
      "((r .1) .1) === y",
      // nonterminal ancestors are freshly built, not the host.
      "(r === host) = ()",
      // a shared left subtree is rebuilt as independent occurrences.
      "((rs .0) === (rs .1)) = ()",
      // operands are not written.
      "(host = [[], [[], []]])",
      "(y = [[], [[[]], []]])",
      "(shared = [[], []])",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("gap and spin fold immediate element counts with alternating signs", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      ["(gap []) = 0", "<>"],
      ["(gap [[[], []]]) = 2", "<>"],
      ["(gap [[[], []], [[], [], []]]) = 1", "<>"],
      ["(spin [[[], []], [[], [], [], [], []]] 4) = (0 - (3 / 4))", "<>"],
      ["(spin [[[], [], [], [], []], [[], []]] 4) = (3 / 4)", "<>"],
      ["(spin [] 4) = 0", "<>"],
      // N must be a positive count.
      ["spin [[[], []]] 0", "$!.division-by-zero /"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("native terminal count observes Star and flat repetition", async () => {
  const session = await figuresSession();
  await session.call(".host [[], []]; .rep [[], [], []];");
  for (
    const source of [
      "(host * rep).## = 6",
      "([[[]], [[]]] * rep).## = 6",
      "(host.## [rep]).## = 6",
      "([[[], []]].## [[[]]]) = [[[]], [[]]]",
      "([[[], []]] * [[]]) = [[[[]], [[]]]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("unsupported inputs are rejected explicitly rather than silently degraded", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      // Native observation determines availability, including valid zero.
      ["[[], [[], []]].### ? {<>} : {()}", "<>"],
      ["[.k 1; []].### ? {<>} : {()}", "<>"],
      // Counts now have parity; strings remain excluded (nil prints as empty).
      ["5.### ? {<>} : {()}", "<>"],
      ["“hi”.### ? {<>} : {()}", ""],
      ["([], []).### ? {<>} : {()}", "<>"],
      ["[[], 5].### ? {<>} : {()}", "<>"],
      // A local observation branch preserves identity or refuses at the use site.
      ["([[], []].### ? {[[], []]} : {unsupported-figure}) = [[], []]", "<>"],
      ["5.###", "1"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  expect(
    await session.call(
      "([[], 5].### ? {[[], 5]} : {unsupported-figure}) = [[], 5]",
    ),
  ).toEqual("<>");
});

Deno.test("derived observations retain their native host boundary", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      ["gap ([], [[], []])", "1"],
      ["spin [[], 5] 4", "-1"],
      ["gap [[], 5]", "4"],
      ["gap 5", "1"],
      ["spin 5 4", "1/4"],
      ["gap 2", "0"],
      ["spin 0 4", "0"],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  for (const source of ["gap (-3)"]) {
    expect(await session.call(source), source).toContain("unsupported-figure");
  }
  expect(await session.call("[[], “a”] * [[]]")).toContain("star-domain");
  expect(await session.call("([[], []] * [[]]) = [[[]], [[]]]"))
    .toEqual("<>");
  expect(await session.call("(gap [[[], []], [[], [], []]]) = 1"))
    .toEqual("<>");
  // A supported mixed host still rejects an invalid resolution.
  expect(await session.call("spin [[], 5] 2.5"))
    .toContain("$!");
});

Deno.test("native Star differs from the old Figure-specific U-cell Star", async () => {
  const session = await figuresSession();
  // Old semantics (009.05/009.06): a U-form cell Figure[Z] was the substitution
  // site and the empty Figure Z had Size 0. Natively the empty frame [] is a
  // terminal with Size 1, and the substitution site is any native terminal.
  for (
    const [source, expected] of [
      // The empty frame is now one terminal (old Size(Z) was 0).
      ["[].##", "1"],
      // A bare empty list is an eligible Star site (old Z was not a cell).
      ["([] * [[]]) = [[]]", "<>"],
      // On the form [[]] the native Star recurses and replaces the inner
      // terminal, where the old U-cell Star treated the whole thing as a cell.
      ["([[]] * [[], []]) = [[[], []]]", "<>"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});
