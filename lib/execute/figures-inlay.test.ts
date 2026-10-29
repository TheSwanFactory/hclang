import { expect } from "jsr:@std/expect@^0.219.1";
import { HCLang } from "../mod.ts";

type Form = Form[];

// All ordered rooted forms with exactly n nodes, counting Z as one node.
function forms(n: number): Form[] {
  return forests(n - 1);
}

function forests(n: number): Form[][] {
  if (n === 0) return [[]];
  const result: Form[][] = [];
  for (let size = 1; size <= n; size++) {
    for (const first of forms(size)) {
      for (const rest of forests(n - size)) result.push([first, ...rest]);
    }
  }
  return result;
}

// Unguarded U-form substitution on bracket trees, independent of HC dispatch.
function referenceInlay(x: Form, y: Form): Form {
  function sub(node: Form): Form {
    return node.length === 1 && node[0].length === 0 ? y : node.map(sub);
  }
  return sub(x);
}

function countCells(form: Form): number {
  return form.length === 1 && form[0].length === 0
    ? 1
    : form.reduce((sum, child) => sum + countCells(child), 0);
}

function construct(form: Form): string {
  return `(Figures.Figure [${form.map(construct).join(", ")}])`;
}

Deno.test("bundled Figure inlay matches unguarded form and Size on all forms through five nodes", async () => {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  const domain = [1, 2, 3, 4, 5].flatMap(forms);
  expect(domain.length).toEqual(23);
  for (const x of domain) {
    for (const y of domain) {
      const source = `((${construct(x)}.inlay ${construct(y)}).form()) = ${
        JSON.stringify(referenceInlay(x, y))
      }`;
      expect(await session.call(source), source).toEqual("<>");
      const expectedSize = Array.from(
        { length: countCells(referenceInlay(x, y)) },
        (): Form => [[]],
      );
      const sizeSource = `((${construct(x)}.inlay ${
        construct(y)
      }).size()).form() = ${JSON.stringify(expectedSize)}`;
      expect(await session.call(sizeSource), sizeSource).toEqual("<>");
    }
  }
});

async function figuresSession(): Promise<HCLang> {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  await session.call(
    ".Figure {Figures.Figure _}; .Z Figures.Z; .U Figures.U;",
  );
  return session;
}

Deno.test("inlay zero boundary preserves form, Size, and replacement identity", async () => {
  const session = await figuresSession();
  for (const form of [1, 2, 3, 4, 5].flatMap(forms)) {
    await session.call(`.right ${construct(form)};`);
    for (
      const source of [
        "(U.inlay right) === right",
        "((Figure [Figure []]).inlay right) === right",
        "((Z.inlay right).form()) = []",
        "((Z.inlay right).size()) = Z",
        "((Z.inlay right) === Z) = ()",
      ]
    ) {
      expect(await session.call(source), source).toEqual("<>");
    }
  }
  await session.call(
    ".empty (Figure []); .left (Figure [U]); .result (left.inlay empty);",
  );
  for (
    const source of [
      "(U.inlay Z) === Z",
      "(U.inlay empty) === empty",
      "(result.form()) = [[]]",
      "(result.size()) = (Figure [U])",
      "(result.children .0) === empty",
      "(result === left) = ()",
      "(left.size()) = (U.size())",
      "((U.inlay empty).size()) = Z",
      "((Figure [U, U]).inlay empty).form() = [[], []]",
      "(((Figure [U, U]).inlay empty).size()) = Z",
      "(left.form()) = [[[]]]",
      "(empty.form()) = []",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("inlay captures survive member and caller name collisions", async () => {
  const session = await figuresSession();
  // Inherited Figures retain the real bundled methods while supplying extra
  // members. Exercise collisions on cells, noncell nodes, and the right operand.
  const collisions = ".x 91; .y 92; .sub 93; .kids 94; " +
    ".receiver 95; .replacement 96; .visit 97; .node 98;";
  await session.call(
    `.cell [.^ (Figure [Z]); ${collisions}]; ` +
      `.branch [.^ (Figure [cell, Z, cell]); ${collisions}]; ` +
      `.right [.^ (Figure [Z, U]); ${collisions}]; ` +
      `.left (Figure [branch, cell]); ${collisions}`,
  );
  for (
    const source of [
      "(cell.inlay right) === right",
      "((branch.inlay right).form()) = [right.form(), [], right.form()]",
      "((left.inlay right).form()) = [[right.form(), [], right.form()], right.form()]",
      "((left.inlay Z).form()) = [[[], [], []], []]",
      "((left.inlay (Figure [])).form()) = [[[], [], []], []]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("inlay reuses replacements and rebuilds ancestors without child dispatch", async () => {
  const session = await figuresSession();
  await session.call(
    ".cell [.^ (Figure [Z]); .inlay {Z}]; " +
      ".shared (Figure [cell, U]); .left (Figure [shared, shared]); " +
      ".right (Figure [Z, Figure [U, Z]]); .result (left.inlay right);",
  );
  for (
    const source of [
      "(cell.inlay right) === Z",
      "(result.form()) = [[right.form(), right.form()], [right.form(), right.form()]]",
      "(U.inlay right) === right",
      "((result.children .0).children .0) === right",
      "((result.children .1).children .1) === right",
      "(result === left) = ()",
      "((result.children .0) === shared) = ()",
      "((result.children .0) === (result.children .1)) = ()",
      "(left.children .0) === (left.children .1)",
      "(left.form()) = [[[[]], [[]]], [[[]], [[]]]]",
      "(right.form()) = [[], [[[]], []]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("retained callbacks keep inlay receivers and arguments across calls", async () => {
  const session = await figuresSession();
  await session.call(
    ".Deferred [.^ Z; .later {.receiver _^; .replacement _; " +
      "{(_^.receiver).inlay _^.replacement}}]; " +
      ".left [.^ Deferred; .children [U, U]]; " +
      ".other [.^ Deferred; .children [Figure [U]]]; " +
      ".right (Figure [Z, U]); .second (Figure [U, Z, U]); " +
      ".first_call (left.later right); .second_call (other.later second);",
  );
  for (
    const source of [
      "(first_call().form()) = [right.form(), right.form()]",
      "(second_call().form()) = [[second.form()]]",
      "(first_call().children .0) === right",
      "((second_call().children .0).children .0) === second",
      "(first_call().children .1) === right",
      "(left.form()) = [[[]], [[]]]",
      "(other.form()) = [[[[]]]]",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});
