import { expect } from "jsr:@std/expect@^0.219.1";
import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameExpr,
  FrameImport,
  FrameNote,
  FrameResource,
  MemoryStore,
} from "../frames.ts";
import { FrameHandle } from "../frames/frame-handle.ts";
import * as MathOps from "../ops/math.ts";
import { evaluate } from "./evaluate.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import { HCTest } from "./hc-test.ts";
import { HCLang } from "./hc-lang.ts";

class Counter extends Frame {
  public readonly effects = { calls: 0 };
  public get calls(): number {
    return this.effects.calls;
  }
  public override call(_argument: Frame): Frame {
    return Frame.count(BigInt(++this.effects.calls));
  }
}

/** Look through the top-level group/statement, without evaluating again. */
const answer = (source: string): Frame => {
  let value: Frame = evaluate(source).asArray().at(-1)!;
  while (
    value.constructor === FrameExpr || value.constructor.name === "FrameGroup"
  ) {
    value = value.asArray().at(-1)!;
  }
  return value.referent();
};

Deno.test("diagnostic classification agrees at shallow control boundaries", () => {
  for (const label of ["!", ">", "-", "+", "~", "=", "unknown"]) {
    const note = new FrameNote(label, "probe");
    const failed = ["!", ">", "-"].includes(label);
    expect(note.is.note).toBe(true);
    expect(note.is.error === true).toBe(failed);
    expect(note.isError()).toBe(failed);
    expect(note.isFailedResult()).toBe(failed);
    expect(note.observationError() === note).toBe(failed);
    expect(note.copy().isError()).toBe(failed);
    const held = new FrameArray([note]);
    expect(held.isError()).toBe(false);
    expect(held.isFailedResult()).toBe(failed);
    expect(new FrameArray([held]).isFailedResult()).toBe(false);
  }
  for (
    const note of [
      FrameNote.key("x", Frame.nil),
      FrameNote.index("x"),
      FrameNote.fail("x", "0"),
    ]
  ) expect(note.is.error).toBe(true);
});

Deno.test("all math operations preserve either error operand and its referent", () => {
  const operations = [
    MathOps.Add,
    MathOps.Subtract,
    MathOps.Multiply,
    MathOps.Divide,
    MathOps.Modulo,
    MathOps.Power,
    MathOps.GreaterThan,
    MathOps.GreaterThanOrEqual,
    MathOps.LessThan,
    MathOps.LessThanOrEqual,
    MathOps.Equals,
    MathOps.TypeEquals,
    MathOps.Identical,
  ];
  const right = Frame.error("$!.second");
  const ordinary = Frame.count(1n);
  for (
    const error of [
      FrameNote.key("x", Frame.nil),
      FrameNote.index("x"),
      FrameNote.fail("x", "0"),
      Frame.error("$!.first"),
    ]
  ) {
    for (const operation of operations) {
      expect(operation(error, ordinary)).toBe(error);
      expect(operation(ordinary, error)).toBe(error);
      expect(operation(error, right)).toBe(error);
      expect(operation(new FrameHandle(error, false), ordinary)).toBe(error);
      expect(operation(ordinary, new FrameHandle(error, false))).toBe(error);
    }
  }
});

Deno.test("source operators and conditionals cannot discard diagnostic failures", () => {
  for (
    const operator of [
      "+",
      "-",
      "*",
      "/",
      "%%",
      "**",
      ".<",
      ".>",
      ".<=",
      ".>=",
      ".<<",
      ".>>",
      "=",
      "==",
      "===",
    ]
  ) {
    for (
      const source of [
        `([].nope) ${operator} 1`,
        `1 ${operator} ([].nope)`,
        `([].nope) ${operator} ([].other)`,
      ]
    ) {
      const result = answer(source);
      expect(result.isError()).toBe(true);
      expect(result.toString()).toContain("name-missing");
      expect(result.toString()).not.toContain(".++");
      expect(result.toString()).not.toContain("other");
    }
  }
  for (
    const source of [
      "([].nope) ? {$$.tick ()} : {$$.tick ()}",
      "(1 .> ([].nope)) ? {$$.tick ()} : {$$.tick ()}",
      "(1 + ([].nope)) ? {$$.tick ()} : {$$.tick ()}",
      "([].nope) : {$$.tick ()}",
      "([].nope) = ($$.tick ())",
      "{([].nope); $$.tick ()} ()",
      "{$!.stop; $$.tick ()} ()",
    ]
  ) {
    const tick = new Counter();
    expect(evaluate(source, { tick }).isFailedResult()).toBe(true);
    expect(tick.calls).toBe(0);
  }
  for (
    const source of [
      "() : {$$.tick ()}",
      "<> ? {$$.tick ()}",
      "<> ? {()} : {$$.tick ()}",
    ]
  ) {
    const tick = new Counter();
    evaluate(source, { tick });
    expect(tick.calls).toBe(1);
  }
});

Deno.test("aggregates still collect failures and construct successful siblings", () => {
  const result = answer("[.a ([].nope); .b 2]");
  expect(result.get_here("a").is.missing).toBe(true);
  expect(result.get_here("b").toString()).toBe("2");
  expect(result.isError()).toBe(false);
  expect(result.isFailedResult()).toBe(true);
});

Deno.test("an aggregate that collected a failure can still be read", () => {
  // Only a term that is itself an error ends an expression; the aggregate
  // holding one is an ordinary value (PR #472 review).
  expect(answer("[.a ([].nope); .b 2].b").toString()).toBe("2");
  expect(answer(".o [.a ([].nope); .b 2]; o.b").toString()).toBe("2");
  expect(answer("[([].nope), 7] .1").toString()).toBe("7");
  expect(answer("[([].nope), 7] .#").toString()).toBe("2");
  const element = answer("[([].nope)] .0");
  expect(element.isError()).toBe(true);
  expect(element.toString()).toMatch(/^\$!\.name-missing/);
  expect(answer("[(1 / 0)] .0").toString()).toBe("$!.division-by-zero /");
  // The aggregate is present, so it selects the then branch.
  expect(answer("[(1 / 0)] ? {1} : {2}").toString()).toBe("1");
});

Deno.test("imports stop on diagnostic declarations and preserve only completed work", () => {
  for (const kind of ["local", "named"] as const) {
    for (const prior of [false, true]) {
      const file = new FrameArray([]);
      const old = new FrameArray([]);
      if (prior) file.set("module", old);
      const tick = new Counter();
      const store = new MemoryStore();
      store.write(
        "module.hc",
        ".before 7; .x ([].nope); .after ($$.tick ()); ]",
      );
      const resource = FrameResource.root(store).extend(
        "./module.hc",
      ) as FrameResource;
      const result = new FrameImport(
        kind === "local" ? { kind } : { kind, key: "module" },
        resource,
        evaluateResourceSource,
      ).in(EvaluationScope.root(file, new Frame({ tick })));
      expect(result.isFailedResult()).toBe(true);
      expect(result.toString()).toContain("name-missing");
      expect(result.toString()).not.toContain("parse");
      expect(tick.calls).toBe(0);
      expect(file.get_here("after").is.missing).toBe(true);
      expect(file.get_here("x").is.missing).toBe(true);
      if (kind === "local") {
        expect(file.get_here("before").toString()).toBe("7");
      } else expect(file.get_here("before").is.missing).toBe(true);
      if (prior) expect(file.get_here("module")).toBe(old);
      else expect(file.get_here("module").is.missing).toBe(true);
    }
  }
});

Deno.test("named literals are lazy atoms, independent of same-named bindings", () => {
  for (const semi of ["", ";"]) {
    const declaration = `.zero 99; .f {(_ = 0) ? {$!!.zero${semi}} : {__}}; `;
    expect(answer(declaration + "f 1").toString()).toBe("1");
    expect(answer(declaration + "f 0").toString()).toBe("$!!.zero");
    expect(answer("{ $!!.zero" + semi + " }").isError()).toBe(false);
  }
  expect(answer("$!!.zero").isError()).toBe(true);
  expect(answer("$!!.zero;").toString()).toBe("$!!.zero");
  expect(answer("[$!!.zero, 2]").asArray().map(String)).toEqual([
    "$!!.zero",
    "2",
  ]);
});

Deno.test("user code writes system kinds but raises only user errors (a13/14 §4)", () => {
  // Written as a system kind, raised as the user error with the same reason.
  expect(answer("$!.division-by-zero").toString()).toBe(
    "$!!.division-by-zero",
  );
  expect(answer("$!.division-by-zero").isError()).toBe(true);
  // The interpreter's own error keeps the system namespace.
  expect(answer("1 / 0").toString()).toBe("$!.division-by-zero /");
  // A schema of kinds builds and holds them without propagating.
  expect(evaluate("5 ~ <$!.division-by-zero, $!!.zero>").toString()).toBe(
    "[]",
  );
});

Deno.test("mutating methods return failures without undoing completed writes", () => {
  const output = evaluate(".o_ [.v 1; .m_ {@v 2; ([].nope); @v 3;}]; o_.m_ ()");
  expect(output.toString()).toContain("name-missing");
  expect(output.get_here("o_").get_here("v").toString()).toBe("2");
});

Deno.test("bundled refusals are named errors even with colliding caller bindings", async () => {
  const session = new HCLang();
  await session.call(
    ".unsupported-figure 7; .invalid-demi 8; .invalid-scale 9; .invalid-router 10;",
  );
  await session.call(
    "Figures <- './hc/figures.hc'; Demis <- './hc/demi.hc'; Routers <- './hc/rotor-router.hc';",
  );
  // A closure cannot bind a schema or nil argument, so no source input reaches
  // Gap's refusing branch; check the literal it holds and the same refusal.
  expect(await session.call("Figures"))
    .toContain(": { $!!.unsupported-figure } };");
  expect(await session.call("<2, 3>.### ? {<>} : {$!!.unsupported-figure}"))
    .toBe("$!!.unsupported-figure");
  for (
    const input of ["[2, 0]", "[2, 0, 0, 0]", "(2, 0, 0)", "“abc”", "()", "5"]
  ) {
    expect(await session.call(`Demis.Demi ${input}`)).toBe("$!!.invalid-demi");
  }
  for (
    const input of ["[2, []]", "[2, [], [], []]", "(2, [], [])", "“abc”", "()"]
  ) {
    expect(await session.call(`Routers.RotorRouter ${input}`))
      .toBe("$!!.invalid-router");
  }
  expect(await session.call("(Demis.Demi [2, 0, 0]).scale_ (0 - 1)"))
    .toContain("$!!.invalid-scale");
  expect(await session.call("[5, 3].#### = (Demis.Demi [2, 5, 3])"))
    .toBe("<>");
});

Deno.test("the bundled testdoc imports: its headings are text, not code", async () => {
  // Its `## heading` lines once evaluated their words as names; under
  // constructor flagging the first one stopped the import (PR #472 review).
  const session = new HCLang();
  const result = await session.call("T <- './hc/testdoc.hc'");
  expect(result).not.toContain("$!");
  expect(await session.call("T.#")).not.toContain("$!");
});

Deno.test("test reports retain failed, passed, unimplemented and summary notes", () => {
  const out = new FrameArray([]);
  const tests = new HCTest(out);
  const pass = tests.assertEqual("1", "1", "probe");
  const fail = tests.assertEqual("1", "2", "probe");
  expect(pass.isError()).toBe(false);
  expect(fail.isError()).toBe(true);
  expect(FrameNote.unimplemented("probe", "{}").isError()).toBe(false);
  const summary = tests.finish();
  expect(summary.isError()).toBe(false);
  expect(tests.n.fail).toBe(1);
  expect(out.at(-1)).toBe(summary);
  expect(tests.exitCode).toBe(1);
});
