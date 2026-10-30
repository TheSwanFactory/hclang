import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

// Issue occurrence/figure 009.09: Figures are now ordinary native nested frames
// and the module keeps only nontrivial operations over them. A cell/terminal is the
// empty frame `[]`; a nonempty array recurses over its elements. Inlay replaces
// each native terminal with the right operand, preserving nonterminal nesting,
// with no right-zero guard. These are focused unit tests, not a combinatorial
// oracle.

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  await session.call(
    ".inlay {Figures.inlay _}; " +
      ".gap {Figures.gap _}; .spin {Figures.spin _}; " +
      ".pure {Figures.pure _}; .need {Figures.need _};",
  );
  return session;
}

Deno.test("inlay replaces native terminals, preserving nonterminal nesting", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      // empty host: the empty frame is a single terminal, so it becomes y.
      ["(inlay [] [[]]) = [[]]", "<>"],
      // singleton host wraps the replacement once.
      ["(inlay [[]] [[], []]) = [[[], []]]", "<>"],
      // nested nonempty host: each terminal becomes y, nesting preserved.
      ["(inlay [[], [], [[], []]] [[]]) = [[[]], [[]], [[[]], [[]]]]", "<>"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  // Atomic host is outside the supported pure domain: the terminal is the
  // empty frame, and a bare atom is rejected rather than treated as a cell.
  expect(await session.call("pure 7")).toEqual("");
});

Deno.test("inlay with an empty replacement does not annihilate the host", async () => {
  const session = await figuresSession();
  for (
    const source of [
      // No right-zero guard: an empty y still replaces each terminal.
      "(inlay [[], []] []) = [[], []]",
      "(inlay [[]] []) = [[]]",
      "(inlay [[], []] [[], []]) = [[[], []], [[], []]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("inlay reuses the right operand by identity and leaves the host unchanged", async () => {
  const session = await figuresSession();
  await session.call(
    ".y [[], [[[]], []]]; .host [[], [[], []]]; .shared [[], []]; " +
      ".sharedhost [shared, shared]; .r (inlay host y); " +
      ".rs (inlay sharedhost y);",
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

Deno.test("native terminal count observes inlay and flat repetition", async () => {
  const session = await figuresSession();
  await session.call(".host [[], []]; .rep [[], [], []];");
  for (
    const source of [
      "(inlay host rep).## = 6",
      "(inlay [[[]], [[]]] rep).## = 6",
      "(host.## [rep]).## = 6",
      "([[[], []]].## [[[]]]) = [[[]], [[]]]",
      "(inlay [[[], []]] [[]]) = [[[[]], [[]]]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("unsupported inputs are rejected explicitly rather than silently degraded", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      // pure accepts well-founded nested arrays, ignoring properties (010.04).
      ["pure [[], [[], []]]", "<>"],
      ["pure [.k 1; []]", "<>"],
      // and rejects atoms, strings, and groups (nil prints as the empty
      // string).
      ["pure 5", ""],
      ["pure “hi”", ""],
      ["pure ([], [])", ""],
      ["pure [[], 5]", ""],
      // need returns a pure frame and refuses an impure one.
      ["(need [[], []]) = [[], []]", "<>"],
      ["(need 5) = 5", ""],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  // A frame holding an atom must not be silently accepted as a figure.
  expect(await session.call("need [[], 5]")).toContain("$!");
});

Deno.test("remaining traversals validate their public host boundary", async () => {
  const session = await figuresSession();
  for (
    const source of [
      "inlay [[], “a”] [[]]",
      "gap ([], [[], []])",
      "spin [[], 5] 4",
      "inlay 5 [[]]",
      "gap [[], 5]",
    ]
  ) {
    expect(await session.call(source), source).toContain("unsupported-figure");
  }
  expect(await session.call("(inlay [[], []] [[]]) = [[[]], [[]]]"))
    .toEqual("<>");
  expect(await session.call("(gap [[[], []], [[], [], []]]) = 1"))
    .toEqual("<>");
  // An unsupported host is still refused when the resolution is invalid.
  expect(await session.call("spin [[], 5] 2.5"))
    .toContain("$!");
});

Deno.test("native inlay differs from the old Figure-specific U-cell inlay", async () => {
  const session = await figuresSession();
  // Old semantics (009.05/009.06): a U-form cell Figure[Z] was the substitution
  // site and the empty Figure Z had Size 0. Natively the empty frame [] is a
  // terminal with Size 1, and the substitution site is any native terminal.
  for (
    const [source, expected] of [
      // The empty frame is now one terminal (old Size(Z) was 0).
      ["[].##", "1"],
      // A bare empty list is an eligible inlay site (old Z was not a cell).
      ["(inlay [] [[]]) = [[]]", "<>"],
      // On the form [[]] the native inlay recurses and replaces the inner
      // terminal, where the old U-cell inlay treated the whole thing as a cell.
      ["(inlay [[]] [[], []]) = [[[], []]]", "<>"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});
