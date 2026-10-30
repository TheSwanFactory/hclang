import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

// Issue occurrence/figure 010.02 — native structural terminal size.
//
// Native `.##` counts the terminals of an aggregate's structure: each element
// that is not an aggregate, and each aggregate with no elements, at any depth.
// The empty frame is therefore one terminal, at the root or nested, so on
// Figures' supported domain (finite, property-free nested arrays) `.##` is
// Figure terminal count, and `count` and `size` read it rather than walking
// the frame again. `.#` stays the immediate element count.
//
// Through v0.32.1 `.##` counted only non-aggregate leaves, so every pure
// Figure answered 0. These tests pin the new reading on the shapes the issue
// names, on mixed atom/array trees, and on the Figure observers built on it.

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  // Bring the observers into scope unqualified for terse assertions.
  await session.call(
    ".size {Figures.size _}; .count {Figures.count _}; " +
      ".cells {Figures.cells _}; .pure {Figures.pure _}; " +
      ".inlay {Figures.inlay _}; .B Figures.B;",
  );
  return session;
}

/** The pure shapes the issue names, with `.#` and the terminal count. */
const shapes = [
  ["[]", "0", "1"],
  ["[[]]", "1", "1"],
  ["[[], []]", "2", "2"],
  ["[[], [[], []]]", "2", "3"],
  ["[[[], []], [[], [], []]]", "2", "5"],
] as const;

Deno.test("native .## reads the empty frame as one terminal; .# is unchanged", async () => {
  const session = await figuresSession();
  for (const [frame, elements, terminals] of shapes) {
    expect(await session.call(`${frame}.#`), `${frame}.#`).toEqual(elements);
    expect(await session.call(`${frame}.##`), `${frame}.##`)
      .toEqual(terminals);
  }
});

Deno.test("Figure count and size agree with native .## on the pure domain", async () => {
  const session = await figuresSession();
  for (const [frame, , terminals] of shapes) {
    expect(await session.call(`count ${frame}`), `count ${frame}`)
      .toEqual(terminals);
    expect(await session.call(`(size ${frame}).#`), `(size ${frame}).#`)
      .toEqual(terminals);
    expect(await session.call(`(cells ${frame}).#`), `(cells ${frame}).#`)
      .toEqual(terminals);
  }
});

Deno.test("count keeps its FrameCount answer and size its tally of fresh marks", async () => {
  const session = await figuresSession();
  expect(await session.call("(count [[], []]) == 2")).toEqual("<>");
  expect(await session.call("(size [[], []]) = [[[]], [[]]]")).toEqual("<>");
  // size builds each mark where it visits a terminal, as it did before
  // 010.02: every mark equals B but is neither B itself nor another mark.
  await session.call(".t (size [[], [[], []]]);");
  for (
    const [source, expected] of [
      ["(t .2) = B", "<>"],
      ["(t .2) === B", ""],
      ["(t .0) === (t .1)", ""],
      ["(t .1) === (t .2)", ""],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("mixed atom/array trees: .## counts atoms and empty frames, Figures refuse", async () => {
  const session = await figuresSession();
  for (
    const [source, expected] of [
      ["[1, [2, 3]].##", "3"],
      ["[1, [2, [3, []]]].##", "4"],
      ["[[], 5, [[], “ab”]].##", "4"],
      ["[5, 6].##", "2"],
    ] as const
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
  // `.##` is defined for every aggregate, but the Figure observers stay on
  // their supported domain and refuse a tree holding an atom.
  expect(await session.call("pure [1, [2, 3]]")).toEqual("");
  expect(await session.call("count [1, [2, 3]]"))
    .toContain("$!.name-missing");
  expect(await session.call("size 5")).toContain("$!.name-missing");
});

Deno.test("Size(Inlay(X, Y)) = Size(X) × Size(Y), read through .##", async () => {
  const session = await figuresSession();
  for (const [x, , m] of shapes) {
    for (const [y, , n] of shapes) {
      const product = String(Number(m) * Number(n));
      expect(await session.call(`(inlay ${x} ${y}).##`), `inlay ${x} ${y}`)
        .toEqual(product);
    }
  }
});
