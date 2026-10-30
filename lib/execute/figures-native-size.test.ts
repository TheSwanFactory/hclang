import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

// Issue occurrence/figure 010.02 — Native structural terminal size.
//
// The conjecture under test: Figure terminal count (`size`/`count`) is "the
// organic structural-terminal version" of the native leaf operator `.##`, so
// `.##` could be redefined to count terminals of recursive frame structure,
// with an empty aggregate counting as one terminal.
//
// These tests pin the facts that decide the conjecture. They are the executable
// evidence behind 010.02b.
//
// Finding: the conjecture is FALSE as a global identity, and a global
// redefinition of `.##` would reverse a pinned #411 invariant. The native
// `.##` counts NON-AGGREGATE leaves, so an empty aggregate adds none (`[].## =
// 0`) while atoms count (`[5, 6].## = 2`). The Figure terminal count instead
// reads the empty frame `[]` as the one terminal, so `count [] = 1`, and the
// supported domain has no atoms at all. The two observers therefore disagree on
// exactly the nodes each is built around — the empty frame and the atom — and
// agree only incidentally on an atom-free, nonempty-at-every-level tree.
//
// These are focused regression tests, not a combinatorial oracle. They lock the
// divergence in place so a future unification attempt has a minimal
// counterexample rather than prose.

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  // Bring the terminal observers into scope unqualified for terse assertions.
  await session.call(
    ".size {Figures.size _}; .count {Figures.count _}; " +
      ".cells {Figures.cells _}; .pure {Figures.pure _};",
  );
  return session;
}

Deno.test("native .## counts non-aggregate leaves, so an empty frame adds none", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      // The #411 contract: an empty aggregate contributes zero leaves, at the
      // root or nested, because it holds no non-aggregate node.
      ["[].##", "0"],
      ["[[]].##", "0"],
      ["[[], []].##", "0"],
      ["[[], [[], []]].##", "0"],
      // A nonempty frame counts its atoms as leaves, at any depth.
      ["[5, 6].##", "2"],
      ["[1, [2, [3, []]]].##", "3"],
      // `.#` is the immediate element count and is unchanged by any of this.
      ["[[], [[], []]].#", "2"],
      ["[].#", "0"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("Figure count reads the empty frame as one terminal, where .## reads zero", async () => {
  const session = await figuresSession();
  // The minimal counterexample to the global-redefinition conjecture: on the
  // pure figure domain the two observers disagree at every node, because
  // `.##` contributes 0 for the empty frame and `count` contributes 1.
  for (
    const [frame, native, figure] of [
      ["[]", "0", "1"],
      ["[[]]", "0", "1"],
      ["[[], []]", "0", "2"],
      ["[[], [[], []]]", "0", "3"],
    ] as const
  ) {
    expect(await session.call(`${frame}.##`), `${frame}.##`).toEqual(native);
    expect(await session.call(`count ${frame}`), `count ${frame}`)
      .toEqual(figure);
  }
});

Deno.test("Figure count over the required tree shapes", async () => {
  const session = await figuresSession();
  // The shapes named in the 010.02 task: empty, cell, pair of cells, and a
  // mixed-depth tree. `count` reads one terminal per empty frame.
  for (
    const [frame, expected] of [
      ["[]", "1"],
      ["[[]]", "1"],
      ["[[], []]", "2"],
      ["[[], [[], []]]", "3"],
    ] as const
  ) {
    expect(await session.call(`count ${frame}`), `count ${frame}`)
      .toEqual(expected);
  }
});

Deno.test("mixed atom/array trees are outside the pure domain and are refused", async () => {
  const session = await figuresSession();
  // `.##` happily counts a mixed atom/array tree as native leaves, so the two
  // observers would also disagree here if Figures observed it at all.
  expect(await session.call("[1, [2, 3]].##")).toEqual("3");
  expect(await session.call("[1, [2, [3, []]]].##")).toEqual("3");
  // But Figures reject atoms: a mixed tree is not pure, and the guarded
  // observers refuse it rather than reading an atom as a terminal. This is why
  // the observers cannot be unified even where `.##` would answer a number.
  expect(await session.call("pure [1, [2, 3]]")).toEqual("");
  expect(await session.call("count [1, [2, 3]]"))
    .toContain("$!.name-missing");
  expect(await session.call("size 5")).toContain("$!.name-missing");
});

Deno.test("count is the element count of the terminals cells lists", async () => {
  const session = await figuresSession();
  // `count x` and `(cells x).#` are the same terminal count, read two ways:
  // the size tally's length and the length of the terminal list. This is the
  // native leverage that is actually available on the pure domain — `.#` over
  // the terminals — as opposed to a global `.##` redefinition.
  for (
    const frame of [
      "[]",
      "[[]]",
      "[[], []]",
      "[[], [[], []]]",
      "[[[], []], [[], [], []]]",
    ]
  ) {
    const count = await session.call(`count ${frame}`);
    const cells = await session.call(`(cells ${frame}).#`);
    expect(cells, `(cells ${frame}).# = count ${frame}`).toEqual(count);
  }
});
