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
