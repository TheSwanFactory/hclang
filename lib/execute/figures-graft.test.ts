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

// Historical gsub/graft, interpreted on bracket trees independently of HC
// method dispatch. The outer zero guard is deliberately separate from sub.
function historicalGraft(x: Form, y: Form): Form {
  function sub(node: Form): Form {
    return node.length === 1 && node[0].length === 0 ? y : node.map(sub);
  }
  return y.length === 0 ? [] : sub(x);
}

function construct(form: Form): string {
  return `(Figures.Figure [${form.map(construct).join(", ")}])`;
}

Deno.test("bundled Figure graft matches historical construction on all forms through five nodes", async () => {
  const session = new HCLang();
  expect(await session.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  const domain = [1, 2, 3, 4, 5].flatMap(forms);
  expect(domain.length).toEqual(23);
  for (const x of domain) {
    for (const y of domain) {
      const source = `((${construct(x)}.graft ${construct(y)}).form()) = ${
        JSON.stringify(historicalGraft(x, y))
      }`;
      expect(await session.call(source), source).toEqual("<>");
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

Deno.test("graft captures survive member and caller name collisions", async () => {
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
      "(cell.graft right) === right",
      "((branch.graft right).form()) = [right.form(), [], right.form()]",
      "((left.graft right).form()) = [[right.form(), [], right.form()], right.form()]",
      "(left.graft Z) === Z",
      "(left.graft (Figure []) ) === Z",
    ]
  ) {
    expect(await session.call(source), source).toEqual("<>");
  }
});

Deno.test("graft reuses replacements and rebuilds ancestors without child dispatch", async () => {
  const session = await figuresSession();
  await session.call(
    ".cell [.^ (Figure [Z]); .graft {Z}]; " +
      ".shared (Figure [cell, U]); .left (Figure [shared, shared]); " +
      ".right (Figure [Z, Figure [U, Z]]); .result (left.graft right);",
  );
  for (
    const source of [
      "(cell.graft right) === Z",
      "(result.form()) = [[right.form(), right.form()], [right.form(), right.form()]]",
      "(U.graft right) === right",
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

Deno.test("retained callbacks keep graft receivers and arguments across calls", async () => {
  const session = await figuresSession();
  await session.call(
    ".Deferred [.^ Z; .later {.receiver _^; .replacement _; " +
      "{(_^.receiver).graft _^.replacement}}]; " +
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
