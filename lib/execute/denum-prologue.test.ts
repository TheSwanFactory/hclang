import { expect } from "jsr:@std/expect@^0.219.1";
import {
  denum,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameCount,
  FrameExpr,
} from "../frames.ts";
import { evaluateSourceText } from "./resource-import.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import {
  cdViewOf,
  DENUM_OPERATIONS,
  DenumEngine,
  denumStateOf,
} from "../ops/denum.ts";
import { evaluate } from "./evaluate.ts";
import {
  constructDenum,
  DENUM_SOURCE,
  denumClasses,
  loadDenumClasses,
} from "./denum-prologue.ts";

/** The value a source's last statement answers, unwrapped. */
const value = (source: string): Frame => {
  let answer = FrameExpr.answeredValue(evaluate(source).at(-1)).referent();
  while (!(answer instanceof FrameArray) && answer.asArray().length > 1) {
    answer = FrameExpr.answeredValue(answer.asArray().at(-1)!).referent();
  }
  return answer;
};

const text = (source: string): string => `${value(source)}`;

/** A Denum instance's Count and loads, read from its HC fields. */
const state = (instance: Frame): string =>
  `${instance.getOwn("count")}|${instance.getOwn("loads")}`;

const counts = (...values: number[]): FrameArray =>
  new FrameArray(values.map((n) => new FrameCount(BigInt(n))));

Deno.test("the ranked hash constructs the HC class in a bare evaluator", () => {
  expect(evaluate("X <- './hc/denum.hc'; X").toString()).toContain("$!");
  const d = value("[1, 2, 3].#2");
  expect(d).toBeInstanceOf(FrameArray);
  expect(state(d)).toEqual("3|[4, 0, 2, 0]");
  // A Denum, never a CD view.
  expect(d.toText().toString()).toEqual(
    "“Denum(Arity[4], C=3, W=[4, 0, 2, 0])”",
  );
});

Deno.test("each rank answers the Denum of that rung, with no #n= form", () => {
  const ranks = [0, 1, 2, 3, 4, 5];
  const widths = ranks.map((n) =>
    (value(`[1, 2, 3].#${n}`).getOwn("loads") as FrameArray).elements().length
  );
  expect(widths).toEqual([1, 2, 4, 8, 16, 32]);
  for (const n of ranks) {
    const d = `[1, 2, 3].#${n}`;
    expect(text(`${d}.schema ()`)).toEqual(`“Arity[${widths[n]}]”`);
    expect(text(`${d}.rank ()`)).toEqual(`${n}`);
    // Derived on demand: neither is stored data.
    // `rank` and `schema` are methods (code), not Count or text data.
    expect(value(d).getOwn("rank")).not.toBeInstanceOf(FrameCount);
    expect(`${value(d).getOwn("rank")}`).toContain("denum-engine");
    expect(`${value(d).getOwn("schema")}`).toContain("denum-engine");
    // The CD interpretation is the explicit request, and only that.
    expect(text(`(${d}.cd ()).schema ()`)).toEqual(`“CD[${n}]”`);
    expect(text(`${d}.coordinates ()`)).toEqual("$!.denum-not-cd");
  }
});

Deno.test("bare .# stays the Count and the fixed hashes are unchanged", () => {
  expect(text("[1, 2, 3].#")).toEqual("3");
  expect(text("[1, 2, 3].##")).toEqual("6");
  expect(text("[1, 2, 3].###")).toEqual("2");
  const demi = value("[1, 2, 3].####");
  expect(
    `${demi.getOwn("count")}|${demi.getOwn("left")}|${demi.getOwn("right")}`,
  )
    .toEqual("3|4|2");
  // `.#1` carries the Demi's Count and left and right loads exactly.
  expect(state(value("[1, 2, 3].#1"))).toEqual("3|[4, 2]");
});

Deno.test("a host with no Count, or Count zero, has no Denum", () => {
  // A statement that answers nil leaves the evaluator's group empty.
  for (const source of ["[].#0", "[].#1", "[].#5", "().#2", "0.#3"]) {
    expect(`${evaluate(source)}`).toEqual("[]");
  }
  expect(`${evaluate("[0].#0")}`).not.toEqual("[]");
});

Deno.test("rank above five and failed hosts are named errors", () => {
  expect(text("[1].#6")).toEqual("$!.denum-rank");
  expect(text("[1].#99")).toEqual("$!.denum-rank");
  expect(text("[1].nope.#2")).toContain("$!.");
});

Deno.test("a Denum answers the ranked hash by promotion, never demotion", () => {
  // Count 2, Size 6 and residual 4 give the loads 5 and 1.
  expect(state(value("[5, 1].#1"))).toEqual("2|[5, 1]");
  expect(state(value("[5, 1].#1.#3"))).toEqual("2|[5, 0, 0, 0, 1, 0, 0, 0]");
  expect(text("[5, 1].#3.#1")).toEqual("$!.denum-demotion");
  // The promotion answers a Denum, with no CD identity.
  expect(text("“” ([5, 1].#1.#3)")).toEqual(
    "“Denum(Arity[8], C=2, W=[5, 0, 0, 0, 1, 0, 0, 0])”",
  );
  // Count zero is present for an instance, unlike a childless host.
  const zero = constructDenum(denum.denum(0n, [3n, 1n]));
  expect(state(zero)).toEqual("0|[3, 1]");
  expect(zero.sizeFor("#3")).toBeInstanceOf(FrameArray);
  expect(state(zero.sizeFor("#3"))).toEqual("0|[3, 0, 0, 0, 1, 0, 0, 0]");
});

Deno.test("a forged lookalike is measured like any host, not recognized", () => {
  const fake = value(
    "[.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}].#1",
  );
  expect(state(fake)).toEqual("99|[99, 0]");
});

Deno.test("the class loads once, and a missing source is a named error", () => {
  expect(denumClasses()).toBe(denumClasses());
  expect(`${loadDenumClasses(undefined)}`).toContain(
    "$!.denum-prologue-missing",
  );
  expect(HC_SOURCES.get(DENUM_SOURCE)).toBeDefined();
  expect((loadDenumClasses("this is not hc (") as Frame).isFailedResult())
    .toBe(true);
  // A file that lacks either the constructor or the view derivation is refused.
  expect(`${loadDenumClasses(".view-of {_};")}`).toContain(
    "$!.denum-prologue-missing Denum",
  );
  expect(`${loadDenumClasses(".Denum {_};")}`).toContain(
    "$!.denum-prologue-missing view-of",
  );
  const classes = denumClasses() as { denum: Frame; view: Frame };
  expect(classes.denum).toBeInstanceOf(Frame);
  expect(classes.view).toBeInstanceOf(Frame);
  expect(classes.denum).not.toBe(classes.view);
});

Deno.test("the namespace has one public constructor and no CD name", () => {
  const namespace = new FrameArray([]);
  const source = HC_SOURCES.get(DENUM_SOURCE)!;
  expect(
    evaluateSourceText(source, EvaluationScope.root(namespace))
      .isFailedResult(),
  ).toBeFalsy();
  expect(namespace.getOwn("Denum").is.missing).toBeFalsy();
  for (
    const name of ["CD", "cd", "Cd", "cd-view", "asCD", "toCD", "fromDenum"]
  ) {
    expect(namespace.getOwn(name).is.missing).toBe(true);
  }
  // The text of the bundled file never declares or documents the old names.
  expect(source).not.toMatch(/^\.CD\s/m);
  expect(HC_SOURCES.get(DENUM_SOURCE)).toBe(source);
  // Reached from a user program, the old constructor is simply not a name.
  expect(text("CD [7, [3, 2, 1, 4]]")).toContain("$!");
  // A bare program reaches a Denum only through the ranked hash, and a view
  // only through `.cd ()` on one.
  expect(text("([7, 3].#2).cd ().schema ()")).toContain("$!");
  expect(text("(([7, 3].#2).cd ()).schema ()")).toEqual("“CD[2]”");
});

/** Frames of the raw engine, for the capability tests. */
const call = (...args: Frame[]): string =>
  `${DenumEngine(Frame.nil, new FrameArray(args))}`;
const raw = (...args: Frame[]): Frame =>
  DenumEngine(Frame.nil, new FrameArray(args));
const n = (v: number): FrameCount => new FrameCount(BigInt(v));

/** A native Denum state and its derived view, as the HC class makes them. */
const stateFrame = (count: number, ...loads: number[]): Frame =>
  raw(n(DENUM_OPERATIONS.build), n(count), counts(...loads));
const viewFrame = (count: number, ...loads: number[]): Frame =>
  raw(n(DENUM_OPERATIONS.view), stateFrame(count, ...loads));

Deno.test("denum-engine refuses malformed requests with named errors", () => {
  expect(call()).toEqual("$!!.invalid-denum");
  expect(call(n(99), n(0), counts(0, 0))).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(0), counts(0))).toEqual("[0, [0]]");
  expect(call(n(0), n(9), counts(0))).toEqual("[9, [0]]");
  expect(call(n(0), n(0), counts(0, 0))).toEqual("[0, [0, 0]]");
  // An empty load list and a bare Count for the loads are refused.
  expect(call(n(0), n(0), counts())).toEqual("$!!.invalid-denum");
  expect(call(n(0), n(0), n(0))).toEqual("$!!.invalid-denum");
  // A CD op given a view runs; the same op given a payload is refused by name.
  expect(call(n(6), viewFrame(0, 0, 0, 0, 0), n(1))).toEqual(
    "$!.denum-demotion",
  );
  expect(call(n(6), viewFrame(0, 0, 0), n(7))).toEqual("$!.denum-rank");
  expect(call(n(6), n(0), counts(0, 0, 0, 0), n(1))).toEqual(
    "$!.denum-not-view",
  );
  // A binary operation without its right operand is refused, not defaulted.
  expect(call(n(3), viewFrame(0, 0, 1))).toEqual("$!.denum-not-view");
  // Rank mismatch is promotion, not an error.
  expect(
    call(n(3), viewFrame(1, 0, 1), viewFrame(1, 0, 1, 0, 0)),
  ).toEqual("[1, [0, 0, 0, 1]]");
});

Deno.test("denum-engine answers a two-field state and refuses legacy rank payloads", () => {
  // Legacy shape [op, rank, count, loads]: the loads slot is read as a Count.
  for (const op of [0, 11, 13]) {
    expect(call(n(op), n(1), n(3), counts(4, 2))).toEqual("$!!.invalid-denum");
  }
  expect(call(n(12), n(1), n(3), counts(4, 2), n(1), n(3), counts(4, 2)))
    .toEqual("$!!.invalid-denum");
  // The current shape answers [count, loads], with no rank in the answer.
  expect(call(n(0), n(3), counts(4, 2))).toEqual("[3, [4, 2]]");
  expect(call(n(DENUM_OPERATIONS.opposite), viewFrame(3, 4, 2))).toEqual(
    "[3, [2, 4]]",
  );
  // Rank is an observation of the loads, never of the Count.
  const rank = (count: number, ...loads: number[]) =>
    call(n(DENUM_OPERATIONS.rank), n(count), counts(...loads));
  expect(rank(0, 1)).toEqual("0");
  expect(rank(0, 1, 1)).toEqual("1");
  expect(rank(0, 1, 1, 1)).toEqual("1");
  expect(rank(1000, 1, 1, 1, 1, 1)).toEqual("2");
  expect(rank(1, ...Array(33).fill(0))).toEqual("5");
  expect(rank(1, ...Array(64).fill(0))).toEqual("6");
  // The CD schema is view-only; the generic schema never claims a CD rung,
  // even at a power-of-two arity.
  const denumSchema = DENUM_OPERATIONS.denumSchema;
  expect(call(n(denumSchema), n(0), counts(1, 2, 3))).toEqual("“Arity[3]”");
  expect(call(n(denumSchema), n(0), counts(1, 2, 3, 4))).toEqual("“Arity[4]”");
  expect(call(n(DENUM_OPERATIONS.schema), viewFrame(0, 1, 2, 3, 4))).toEqual(
    "“CD[2]”",
  );
  expect(call(n(DENUM_OPERATIONS.schema), n(0), counts(1, 2, 3, 4))).toEqual(
    "$!.denum-not-view",
  );
  // A view cannot exist at a non-CD arity, rather than being guessed.
  expect(call(n(DENUM_OPERATIONS.view), stateFrame(0, 1, 2, 3))).toEqual(
    "$!.denum-unsupported-arity",
  );
  expect(
    call(n(DENUM_OPERATIONS.view), stateFrame(0, ...Array(33).fill(0))),
  ).toEqual("$!.denum-unsupported-arity");
});

Deno.test("native capability: CD ops reject payloads, lookalikes and bare states", () => {
  const ops = DENUM_OPERATIONS;
  const payload = [n(7), counts(3, 2, 1, 4)];
  const unary = [
    ops.opposite,
    ops.conjugate,
    ops.names,
    ops.schema,
    ops.residual,
  ];
  for (const op of [...unary, ops.coordinates]) {
    expect(call(n(op), ...payload)).toEqual("$!.denum-not-view");
  }
  expect(call(n(ops.promote), ...payload, n(3))).toEqual("$!.denum-not-view");
  for (const op of [ops.add, ops.subtract, ops.multiply]) {
    expect(call(n(op), ...payload, n(7), counts(3, 2, 1, 4))).toEqual(
      "$!.denum-not-view",
    );
    // A real view on the left does not rescue a payload on the right.
    expect(call(n(op), viewFrame(1, 1, 0, 0, 0), ...payload)).toEqual(
      "$!.denum-not-view",
    );
    expect(call(n(op), ...payload, viewFrame(1, 1, 0, 0, 0))).toEqual(
      "$!.denum-not-view",
    );
  }
  // A plain array that looks like a state or a view is not registered.
  const lookalike = new FrameArray([n(1), counts(1, 0, 0, 0)]);
  expect(call(n(ops.view), lookalike)).toEqual("$!!.invalid-denum");
  expect(call(n(ops.opposite), lookalike)).toEqual("$!.denum-not-view");
  expect(call(n(ops.add), lookalike, lookalike)).toEqual("$!.denum-not-view");
  // A raw payload cannot be turned into a view by the view op either.
  expect(call(n(ops.view), ...payload)).toEqual("$!!.invalid-denum");
  // A Denum state is not a view, and a view is not a Denum state.
  const generic = stateFrame(1, 1, 0, 0, 0);
  const view = viewFrame(1, 1, 0, 0, 0);
  expect(denumStateOf(generic)).toBeDefined();
  expect(cdViewOf(generic)).toBeUndefined();
  expect(cdViewOf(view)).toBeDefined();
  expect(denumStateOf(view)).toBeUndefined();
  expect(call(n(ops.opposite), generic)).toEqual("$!.denum-not-view");
  expect(call(n(ops.view), view)).toEqual("$!!.invalid-denum");
  // A copy of a view's elements has the same text and no capability.
  const copy = new FrameArray(view.referent().elements());
  expect(`${copy}`).toEqual(`${view}`);
  expect(call(n(ops.opposite), copy)).toEqual("$!.denum-not-view");
  // The registered view works, and its result is a view again.
  const flipped = raw(n(ops.opposite), view);
  expect(`${flipped}`).toEqual("[1, [0, 0, 1, 0]]");
  expect(cdViewOf(flipped)).toBeDefined();
  expect(cdViewOf(raw(n(ops.add), view, flipped))).toBeDefined();
  // The generic ops answer states, never views.
  expect(
    denumStateOf(raw(n(ops.addDenum), n(1), counts(1, 2), n(1), counts(3, 4))),
  )
    .toBeDefined();
  // `viewable` is a data question, never a capability.
  for (
    const [a, expected] of [[1, 1], [2, 1], [3, 0], [4, 1], [5, 0], [32, 1], [
      33,
      0,
    ], [64, 0]]
  ) {
    expect(
      call(n(ops.viewable), stateFrame(0, ...Array(a).fill(0))),
    ).toEqual(`${expected}`);
  }
  expect(call(n(ops.viewable), n(0), counts(0, 0))).toEqual("0");
  expect(call(n(ops.viewable))).toEqual("0");
});

Deno.test("a user program cannot reach a CD operation with a raw payload", () => {
  for (
    const program of [
      "denum-engine [3, 1, [0, 1, 0, 0], 1, [0, 1, 0, 0]]",
      "denum-engine [1, 7, [3, 2, 1, 4], 7, [3, 2, 1, 4]]",
      "denum-engine [7, 7, [3, 2, 1, 4]]",
      "denum-engine [14, 7, [3, 2, 1, 4]]",
      "denum-engine [14, [7, [3, 2, 1, 4]]]",
      "denum-engine [9, [7, [3, 2, 1, 4]]]",
      "denum-engine [9, [.count 7; .loads [3, 2, 1, 4]]]",
    ]
  ) {
    expect(text(program)).toMatch(/^\$!!?\.(denum-not-view|invalid-denum)$/);
  }
});

Deno.test("coordinates: nil is signed, true is unsigned, native not truthiness", () => {
  // Instances come from the ranked hash: this bare evaluator cannot import the
  // class file, and the exact loads are pinned by the testdocs in hc/denum.hc.
  const opposed = "((([1, 2, 3].#2).cd ()).opp ())";
  const one = "([1, 2, 3].#1.cd ())";
  expect(text(`${one}.coordinates ()`)).toEqual("[2]");
  expect(text(`${one}.coordinates <>`)).toEqual("[6]");
  expect(text(`${one}.observe ()`)).toEqual("[2]");
  expect(text(`${opposed}.loads`)).toEqual("[2, 0, 4, 0]");
  expect(text(`${opposed}.coordinates ()`)).toEqual("[-2, 0]");
  expect(text(`${opposed}.coordinates <>`)).toEqual("[6, 0]");
  expect(text(`${opposed}.count`)).toEqual("3");
  // D0 answers [W] in both modes.
  expect(text("([1, 2, 3].#0.cd ()).coordinates ()")).toEqual("[6]");
  expect(text("([1, 2, 3].#0.cd ()).coordinates <>")).toEqual("[6]");
  expect(text("([1, 2, 3].#5.cd ()).coordinates <>").split(",").length).toBe(
    16,
  );
  for (const bad of ["1", "0", "“x”", "[1]", "[]", "{1}"]) {
    expect(text(`([1, 2, 3].#2.cd ()).coordinates ${bad}`)).toEqual(
      "$!!.unary-observation",
    );
  }
  expect(text("([1, 2, 3].#2.cd ()).observe <>")).toEqual(
    "$!!.unary-observation",
  );
});

Deno.test("denum-engine coordinates mode is exactly 0, 1 or absent", () => {
  const view = () => viewFrame(7, 3, 2, 1, 4);
  expect(call(n(7), view())).toEqual("[2, -2]");
  expect(call(n(7), view(), n(0))).toEqual("[2, -2]");
  expect(call(n(7), view(), n(1))).toEqual("[4, 6]");
  expect(call(n(7), view(), n(2))).toEqual("$!!.invalid-denum");
  expect(call(n(7), view(), new FrameArray([]))).toEqual("$!!.invalid-denum");
});

Deno.test("coordinates agree with the HC observers d.## and d.### on ranks 0 to 5", () => {
  const sum = (list: string): bigint =>
    list.replace(/[[\]\s]/g, "").split(",").reduce((a, v) => a + BigInt(v), 0n);
  let checked = 0;
  // Hosts of several shapes; `.opp ()` and `+` give balanced and empty-ish states.
  for (const host of ["[1, 2, 3]", "[4, 4, 4, 4]", "[5]", "[2, 0]"]) {
    for (let rank = 0; rank <= 5; rank++) {
      const d = `(${host}.#${rank}.cd ())`;
      const read = (expression: string): string => text(`${d}${expression}`);
      const states = [
        d,
        `(${d} + (${d}.opp ()))`, // present and balanced, never empty
        `(${d} * ${d})`,
      ];
      for (const s of states) {
        if (text(`${s}.rank ()`) === "()") continue;
        const size = BigInt(text(`${s}.##`));
        const residual = BigInt(text(`${s}.###`));
        const unsigned = text(`${s}.coordinates <>`);
        const signed = text(`${s}.coordinates ()`);
        // Σ U = d.## at every rank, Σ S = d.### from rank 1.
        expect(sum(unsigned)).toBe(size);
        checked++;
        if (s === d && rank === 0) {
          expect(sum(signed)).toBe(size);
          expect(residual).toBe(0n);
        } else if (text(`${s}.rank ()`) === "0") {
          expect(residual).toBe(0n);
        } else {
          expect(sum(signed)).toBe(residual);
        }
      }
      expect(read(".coordinates ()")).toEqual(read(".observe ()"));
    }
  }
  // The loop is not vacuous: most host/rank/state combinations are views.
  expect(checked).toBeGreaterThan(40);
  // Zero and positive Count over the same loads, and the D0 exception by name.
  expect(text("([0, 0, 0].#0.cd ()).coordinates ()")).toEqual("[0]");
  expect(text("([1, 2, 3].#0.cd ()).##")).toEqual("6");
  expect(text("([1, 2, 3].#0.cd ()).###")).toEqual("0");
  expect(text("([1, 2, 3].#1.cd ()).###")).toEqual("2");
});

Deno.test("the HC classes refuse the legacy constructor and spoofed operands", () => {
  // Under a bare evaluator the class is reached through the ranked hash.
  const d = "([5, 1].#1)";
  const v = `(${d}.cd ())`;
  expect(text(`${d}.rank ()`)).toEqual("1");
  expect(text(`${d}.rank 1`)).toEqual("$!!.unary-observation");
  expect(text(`${v}.rank ()`)).toEqual("1");
  expect(text(`${v} + [.count 2; .loads [5, 1]]`)).toEqual(
    "$!!.invalid-denum",
  );
  expect(text(`${d} + [.count 2; .loads [5, 1]]`)).toEqual(
    "$!!.invalid-denum",
  );
  expect(text(`“” (${v} + ${v})`)).toContain("CD[1](");
  expect(text(`“” (${d} + ${d})`)).toContain("Denum(Arity[2]");
});

Deno.test("d.cd () is unary, deterministic and leaves the Denum unchanged", () => {
  const g = constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]));
  const before = state(g);
  const d = "([1, 2, 3].#2)";
  expect(text(`“” (${d}.cd ())`)).toEqual("“CD[2](C=3, W=[4, 0, 2, 0])”");
  expect(text(`(${d}.cd ()) = (${d}.cd ())`)).toEqual("<>");
  // A view and the Denum it views are never equal, in either order.
  expect(`${evaluate(`(${d}.cd ()) = ${d}`)}`).toEqual("[]");
  expect(`${evaluate(`${d} = (${d}.cd ())`)}`).toEqual("[]");
  for (const bad of ["1", "0", "<>", "“x”", "[1]", "{1}"]) {
    expect(text(`${d}.cd ${bad}`)).toEqual("$!!.unary-observation");
  }
  // The source remains generic, with the same state, after being viewed.
  expect(text(`“” ${d}`)).toEqual("“Denum(Arity[4], C=3, W=[4, 0, 2, 0])”");
  expect(state(g)).toEqual(before);
  // Arities that are not shipped rungs are refused by name.
  for (const arity of [3, 5, 6, 7, 33, 64]) {
    const loads = Array(arity).fill(0).join(", ");
    expect(text(`(${"[" + loads + "]"}.#2).cd ()`)).toContain("$!");
  }
  // The Denum behind a view is recovered, equal to the original.
  expect(text(`((${d}.cd ()).denum ()) = ${d}`)).toEqual("<>");
});

Deno.test("a Denum keeps its loads; .#n promotes it, or names why not", () => {
  // Binary arities embed and answer Denums; the arity decides nothing else.
  for (const loads of [[5n], [3n, 1n], [3n, 2n, 1n, 4n]]) {
    const generic = constructDenum(denum.denum(7n, loads));
    const before = state(generic);
    for (const rank of [0, 1, 2, 3, 5]) {
      const answer = generic.sizeFor(`#${rank}`);
      const kind = `${answer}`;
      if (rank < Math.floor(Math.log2(loads.length))) {
        expect(kind).toEqual("$!.denum-demotion");
        continue;
      }
      expect(kind).not.toMatch(/^\$!/);
      expect(answer.toText().toString()).toContain("Denum(Arity[");
      expect(`${answer.getOwn("schema")}`).toContain("denum-engine [13");
    }
    expect(`${generic.sizeFor("#6")}`).toEqual("$!.denum-rank");
    // The source is untouched and still the same generic type.
    expect(state(generic)).toEqual(before);
    expect(`${generic.toText()}`).toContain(`Denum(Arity[${loads.length}]`);
  }
  // Other arities have no embedding: never padded, truncated or reread.
  for (
    const loads of [[3n, 2n, 1n], [1n, 2n, 3n, 4n, 5n], Array(64).fill(0n)]
  ) {
    const generic = constructDenum(denum.denum(7n, loads));
    for (const rank of [0, 1, 2, 3, 5]) {
      expect(`${generic.sizeFor(`#${rank}`)}`).toEqual(
        "$!.denum-unsupported-arity",
      );
    }
    expect(`${generic.sizeFor("#6")}`).toEqual("$!.denum-rank");
  }
  const three = constructDenum(denum.denum(7n, [3n, 2n, 1n]));
  expect(state(three)).toEqual("7|[3, 2, 1]");
  expect(`${three.toText()}`).toEqual("“Denum(Arity[3], C=7, W=[3, 2, 1])”");
  // The same data through the view is the same state, and the hash of the
  // Denum is the embedding the view applies, as a Denum.
  const four = constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]));
  expect(state(four.sizeFor("#3"))).toEqual("7|[3, 2, 0, 0, 1, 4, 0, 0]");
});

Deno.test("a CD view is never a source for .#n", () => {
  const v = "([1, 2, 3].#2.cd ())";
  for (const rank of [0, 1, 2, 3, 5]) {
    expect(text(`${v}.#${rank}`)).toEqual("$!.denum-view-source");
  }
  expect(text(`${v}.#6`)).toEqual("$!.denum-rank");
  // The view is unchanged by the refusal.
  expect(text(`${v}.loads`)).toEqual("[4, 0, 2, 0]");
  // Ask the Denum it views; the answer is a Denum, not a view.
  expect(text(`“” ((${v}.denum ()).#3)`)).toContain("Denum(Arity[8]");
  // The derived Demi is unchanged by any of this.
  expect(text(`“” (${v}.####)`)).toEqual("“Demi(3,4,2)”");
});

Deno.test("the HC classes are one constructor and one derived view", () => {
  const g = constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]));
  const view = FrameExpr.answeredValue(g.getOwn("cd").call(Frame.nil))
    .referent();
  // The view reads its Count and loads from the state it holds.
  expect(`${g.getOwn("schema")}`).toContain("denum-engine [13");
  expect(`${view.getOwn("schema")}`).toContain("denum-engine [9");
  expect(`${g.getOwn("count")}|${g.getOwn("loads")}`).toEqual(
    `${view.getOwn("count")}|${view.getOwn("loads")}`,
  );
  // Both state frames are registered natively; only the view's is a view.
  expect(denumStateOf(g.getOwn("state"))).toBeDefined();
  expect(cdViewOf(g.getOwn("state"))).toBeUndefined();
  expect(cdViewOf(view.getOwn("state"))).toBeDefined();
  // The generic type defines no CD algebra, and neither type has a conversion
  // constructor: the view has no `.cd`, and the Denum no `asCD` or `toCD`.
  for (const name of ["asCD", "fromDenum", "toCD", "toDenum", "CD"]) {
    expect(g.getOwn(name).is.missing).toBe(true);
    expect(view.getOwn(name).is.missing).toBe(true);
  }
  expect(view.getOwn("cd").is.missing).toBe(true);
  expect(g.getOwn("denum").is.missing).toBe(true);
  expect(view.getOwn("denum").is.missing).toBeFalsy();
  // Types differ: an instance equals only a same-type rebuild.
  expect(g.typeEquals(view)).not.toBe(Frame.all);
  expect(view.typeEquals(g)).not.toBe(Frame.all);
  expect(g.typeEquals(constructDenum(denum.denum(7n, [3n, 2n, 1n, 4n]))))
    .toBe(Frame.all);
});

Deno.test("denum-engine: generic ops take any arity, a view needs a CD arity", () => {
  const ops = DENUM_OPERATIONS;
  // Generic equal-arity addition: componentwise, Counts add.
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1), n(2), counts(4, 0, 0)))
    .toEqual("[9, [7, 2, 1]]");
  expect(
    call(n(ops.addDenum), n(7), counts(3, 2, 1, 4), n(2), counts(4, 0, 0, 5)),
  ).toEqual("[9, [7, 2, 1, 9]]");
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1), n(2), counts(4, 0, 0, 5)))
    .toEqual("$!.denum-arity-mismatch");
  expect(call(n(ops.addDenum), n(7), counts(3, 2, 1)))
    .toEqual("$!!.invalid-denum");
  // Building: generic accepts everything positive; a view only the shipped
  // arities, and only from a Denum state.
  expect(call(n(ops.build), n(0), counts(0, 0, 0))).toEqual("[0, [0, 0, 0]]");
  expect(call(n(ops.view), stateFrame(0, 0, 0, 0))).toEqual(
    "$!.denum-unsupported-arity",
  );
  expect(call(n(ops.view), stateFrame(0, 0, 0, 0, 0))).toEqual(
    "[0, [0, 0, 0, 0]]",
  );
  expect(call(n(ops.build), n(0), counts())).toEqual("$!!.invalid-denum");
  // Refusals the HC classes cannot raise themselves.
  expect(call(n(ops.refuseNotCD))).toEqual("$!.denum-not-cd");
  expect(call(n(ops.refuseMixed))).toEqual("$!.denum-mixed");
});

/**
 * Evaluates the bundled class file followed by a probe, in a namespace of its
 * own, so a test can use the public constructor directly.
 */
const probe = (code: string): string => {
  const namespace = new FrameArray([]);
  const source = `${HC_SOURCES.get(DENUM_SOURCE)}\n${code}`;
  return `${evaluateSourceText(source, EvaluationScope.root(namespace))}`;
};

Deno.test("mixed Denum and view operands refuse in both directions, at every operator", () => {
  const defs = ".g (Denum [1, [1, 0, 0, 0]]); .c (g.cd ());";
  const run = (expression: string) => probe(`${defs} ${expression}`);
  expect(run("g + c")).toEqual("$!.denum-mixed");
  expect(run("c + g")).toEqual("$!.denum-mixed");
  expect(run("c - g")).toEqual("$!.denum-mixed");
  expect(run("c * g")).toEqual("$!.denum-mixed");
  expect(run("g - c")).toEqual("$!.denum-not-cd");
  expect(run("g * c")).toEqual("$!.denum-not-cd");
  // Lookalikes are neither type, whatever the operator or the order.
  const fake = ".f [.count 1; .loads [1, 0, 0, 0]];";
  for (const operator of ["+", "-", "*"]) {
    expect(run(`${fake} c ${operator} f`)).toEqual("$!!.invalid-denum");
  }
  expect(run(`${fake} g + f`)).toEqual("$!!.invalid-denum");
  // A lookalike with a forged state field is still not a view.
  const forged =
    ".f [.count 1; .loads [1, 0, 0, 0]; .state (denum-engine [0, 1, [1, 0, 0, 0]])];";
  for (const operator of ["+", "-", "*"]) {
    expect(run(`${forged} c ${operator} f`)).toEqual("$!!.invalid-denum");
  }
  // Same-type operands work and keep their type.
  expect(run("“” (g + g)")).toContain("Denum(Arity[4], C=2");
  expect(run("“” (c + c)")).toContain("CD[2](C=2");
  // A view operation answers a view whose retained Denum is recoverable.
  expect(run("“” ((c * c).denum ())")).toContain("Denum(Arity[4], C=1");
});

Deno.test("the ranked hash recognizes a Denum and a view by type, not by arity", () => {
  const defs = ".g (Denum [1, [1, 0, 0, 0]]); .c (g.cd ());";
  const run = (expression: string) => probe(`${defs} ${expression}`);
  expect(run("“” (g.#3)")).toContain("Denum(Arity[8], C=1");
  expect(run("[c.#2, c.#3, c.#0]")).toContain("$!.denum-view-source");
  // A lookalike is measured as an ordinary host, never refused as a view.
  expect(
    run(
      ".f [.count 9; .loads [3, 1]; .# {99}; .## {99}; .### {99}]; “” (f.#1)",
    ),
  ).toEqual("“Denum(Arity[2], C=99, W=[99, 0])”");
});
