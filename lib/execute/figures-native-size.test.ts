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

Deno.test("native sizes and terminal enumeration agree without count helpers", async () => {
  const session = await figuresSession();
  for (const [frame, elements, terminals] of shapes) {
    expect(await session.call(`${frame}.#`)).toEqual(elements);
    expect(await session.call(`${frame}.##`)).toEqual(terminals);
    expect(await session.call(`(Figures.cells ${frame}).#`)).toEqual(terminals);
  }
});

Deno.test("Figures exports no wrappers for native construction and observation", async () => {
  const session = await figuresSession();
  for (
    const name of [
      "Figure",
      "A",
      "B",
      "Z",
      "U",
      "form",
      "size",
      "count",
      "many",
      "mul",
      "sameform",
      "sameness",
      "size_equivalent",
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

Deno.test("withness returns native booleans and compares immediate identity", async () => {
  const session = await figuresSession();
  await session.call(".shared [[]]; .p1 [shared, []]; .p2 [[], shared];");
  for (
    const [source, expected] of [
      ["Figures.withness p1 [shared]", "<>"],
      ["Figures.withness p2 [shared]", "<>"],
      ["Figures.withness p1 [[[]]]", ""],
      ["Figures.withness [] [[[]]]", ""],
      ["Figures.withness [shared] []", "<>"],
      ["Figures.withness [shared] [shared, shared]", "<>"],
      ["Figures.withness [[shared]] [shared]", ""],
    ]
  ) {
    expect(await session.call(source), source).toEqual(expected);
  }
});

Deno.test("native .## counts mixed trees while Figure traversals reject them", async () => {
  const session = await figuresSession();
  expect(await session.call("[1, [2, []]].##")).toEqual("3");
  expect(await session.call("[[], 5, [[], “ab”]].##")).toEqual("4");
  expect(await session.call("Figures.cells [1, [2, []]]"))
    .toContain("unsupported-figure");
});

Deno.test("Inlay terminal product law uses native .## across 25 pairs", async () => {
  const session = await figuresSession();
  for (const [x, , m] of shapes) {
    for (const [y, , n] of shapes) {
      expect(await session.call(`(Figures.inlay ${x} ${y}).##`), `${x}, ${y}`)
        .toEqual(String(Number(m) * Number(n)));
    }
  }
});
