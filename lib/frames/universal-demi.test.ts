import { expect } from "jsr:@std/expect@^0.219.1";
import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameAtom,
  FrameBlob,
  FrameBytes,
  FrameCount,
  FrameDecimal,
  FrameDoc,
  FrameExpr,
  FrameInt,
  FrameLazy,
  FrameNumber,
  FrameRational,
  FrameResource,
  FrameSchema,
  FrameScoped,
  FrameString,
  FrameType,
  MemoryStore,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";
import { FrameHandle } from "./frame-handle.ts";

const last = (source: string): Frame =>
  evaluate(source).at(-1).asArray().at(-1)!;

/** The value of a one-expression source that answers an aggregate, a Demi. */
const value = (source: string): Frame =>
  FrameExpr.answeredValue(evaluate(source).at(-1)).referent();

/**
 * A Demi's state as the retired native encoding spelled it, orientation then
 * loads, read from the fields of the HC instance (011.20); undefined when the
 * value is not a Demi.
 */
const encode = (
  value: Frame,
): readonly [string, string, string] | undefined => {
  const [phase, left, right] = ["phase", "left", "right"].map((key) =>
    value.getOwn(key)
  );
  if (phase.is.missing || left.is.missing || right.is.missing) return undefined;
  return [phase.toString() === "2" ? "all" : "nil", `${left}`, `${right}`];
};

/** The loads and phase of a Demi, as bigints and the orientation. */
const loads = (
  value: Frame,
): { left: bigint; right: bigint; even: boolean } => {
  const state = encode(value);
  if (!state) throw new Error(`not a Demi: ${value}`);
  return {
    left: BigInt(state[1]),
    right: BigInt(state[2]),
    even: state[0] === "all",
  };
};

/** `d x`, through an immutable name as HC reads one: a functional update. */
const deposit = (d: Frame, x: Frame): Frame =>
  FrameExpr.answeredValue(new FrameHandle(d, false).call(x)).referent();

/** `d.scale_ k`, through an immutable name. */
const scale = (d: Frame, k: Frame): Frame =>
  FrameExpr.answeredValue(new FrameHandle(d, false).get("scale_").call(k))
    .referent();

Deno.test("sized values take Count from Size and residual from Count parity (011.18k)", () => {
  for (
    const value of [
      new FrameInt(5n),
      new FrameInt(-5n),
      new FrameDecimal("-5.9"),
      new FrameRational(-11n, 2n),
      new FrameNumber(-5.9),
      new FrameInt(9007199254740993123456789n),
      new FrameDecimal("0.9"),
      new FrameRational(-1n, 2n),
      new FrameNumber(-0),
      new FrameString("é😀"),
      new FrameString(""),
      new FrameDoc("é😀"),
      new FrameBlob("0b0001"),
      new FrameBytes([0, 255]),
      new FrameBytes([]),
      new FrameAtom(),
    ]
  ) {
    const count = value.sizeFor("#");
    expect(count).toBeInstanceOf(FrameCount);
    const n = (count as FrameCount).data;
    expect(n).toEqual((value.sizeFor("##") as FrameCount).data);
    const residual = value.sizeFor("###");
    expect(residual.className()).toEqual("FrameInt");
    expect(residual.toString()).toEqual((n % 2n).toString());
    const demi = value.sizeFor("####");
    if (n === 0n) {
      expect(demi).toBe(Frame.nil);
    } else {
      const d = loads(demi);
      expect(d.left + d.right).toEqual(n);
      expect(d.left - d.right).toEqual(n % 2n);
      expect(d.even).toBe(n % 2n === 0n);
    }
  }
  // A non-atom with Count from Size follows the same rule (011.18m).
  const type = FrameType.of(new FrameCount(5n));
  expect(type.sizeFor("#").toString()).toEqual("1");
  expect(type.sizeFor("###").toString()).toEqual("1");
  expect(encode(type.sizeFor("####"))).toEqual([
    "nil",
    "1",
    "0",
  ]);
  expect(last("(10 - 5).#").toString()).toEqual("5");
  expect(last("5.#").toString()).toEqual("5");
  expect(last("(-5.9).#").toString()).toEqual("5");
  expect(new FrameString("hello").sizeFor("#").toString()).toEqual("5");
  for (const value of [Infinity, -Infinity, NaN]) {
    expect(new FrameNumber(value).sizeFor("#").toString()).toEqual(
      "$!.nonquantifiable-size .##",
    );
  }
});

Deno.test("fourth hash distinguishes atom/schema absence, empty hosts and present zero loads", () => {
  for (
    const source of [
      "[]",
      "0",
      "()",
      "<>",
      "<2,3,5>",
      "<.a,.b>",
      "<8 @Bit>",
    ]
  ) {
    expect(evaluate(`${source}.####`).toString(), source).toEqual("[]");
  }
  for (
    const [source, encoding] of [
      ["1", ["nil", "1", "0"]],
      ["“hello”", ["nil", "3", "2"]],
      ["7.9", ["nil", "4", "3"]],
      ["(-7)", ["nil", "4", "3"]],
      ["(10 - 5)", ["nil", "3", "2"]],
      ["2", ["all", "1", "1"]],
      ["3", ["nil", "2", "1"]],
      ["7", ["nil", "4", "3"]],
      ["[0]", ["nil", "0", "0"]],
      ["[0,0]", ["all", "0", "0"]],
      ["[“hello”]", ["nil", "5", "0"]],
      ["[.v <(1).<>> 5; v]", ["nil", "5", "0"]],
      ["[<2,3,5>,2]", ["all", "3", "2"]],
      ["{5 + 3}", ["nil", "8", "1"]],
      ["(5,3)", ["all", "5", "3"]],
    ] as const
  ) {
    expect(encode(value(`${source}.####`)), source).toEqual(encoding);
  }
  // Deposit is application and scaling a method; neither operator is
  // overloaded (011.20).
  expect(value("“” ([[],[]].#### 3)").toString()).toEqual("“Demi((),4,1)”");
  expect(value("“” (7.####.scale_ 2)").toString()).toEqual("“Demi((),8,6)”");
  expect(evaluate("[[],[]].#### + 3").toString()).toEqual("[]");
  expect(value("7.#### * 2").toString()).toEqual("$!.star-metadata *");
  // Nil has no Count; all is the present empty, observed exactly as [] (011.18k).
  expect(evaluate("().#").toString()).toEqual("[]");
  expect(last("<>.#").toString()).toEqual("0");
  expect(last("<>.###").toString()).toEqual("0");
  for (const value of [Frame.nil, Frame.all]) {
    const copy = value.copy();
    copy.set("label", new FrameString("metadata"));
    expect(copy.sizeFor("#").toString())
      .toEqual(value === Frame.nil ? "()" : "0");
    expect(copy.sizeFor("####")).toBe(Frame.nil);
  }
  // The internal missing sentinel is never a value; observing it fails
  // (011.18m), including through a metadata copy.
  const missing = Frame.missing.copy();
  missing.set("label", new FrameString("metadata"));
  for (const key of Frame.SIZE_OPERATORS) {
    expect(missing.sizeFor(key).toString()).toEqual("$!.name-missing");
  }
  expect(Frame.all.copy().sizeFor("###").toString()).toEqual("0");
  expect(last(".####").toString()).toEqual(".####");
});

Deno.test("derived Demi obeys projections over nested mixed values, sharing and bigint Counts", () => {
  const shared = new FrameArray([new FrameCount(5n), new FrameString("ab")]);
  const values = [
    new FrameArray([shared, shared, new FrameArray([shared])]),
    new FrameCount(9007199254740993123456789n),
    new FrameExpr([new FrameCount(5n), new FrameCount(3n)]),
    new FrameArray([new FrameSchema([new FrameCount(99n)]), shared]),
  ];
  for (const value of values) {
    value.set("ignored", value);
    for (
      const receiver of [
        value,
        new FrameHandle(value, false),
        new FrameScoped(value, EvaluationScope.from([])),
      ]
    ) {
      const state = loads(receiver.sizeFor("####"));
      const n = receiver.sizeFor("#") as FrameCount;
      const s = receiver.sizeFor("##") as FrameCount;
      const r = receiver.sizeFor("###") as FrameInt;
      expect(state.left + state.right).toEqual(s.data);
      expect(state.left - state.right).toEqual(r.data);
      expect(state.even).toBe(n.data % 2n === 0n);
    }
  }
  const parent = new FrameArray([shared]);
  const first = loads(parent.sizeFor("####"));
  shared.collect(new FrameCount(2n));
  expect(loads(parent.sizeFor("####")).left).toEqual(first.left + 2n);
});

Deno.test("observation failures propagate without converting nil/zero or executing hosts", () => {
  const stored = Frame.error("$!.stored");
  for (const key of Frame.SIZE_OPERATORS) {
    expect(stored.sizeFor(key)).toBe(stored);
  }
  for (const n of [NaN, Infinity, -Infinity]) {
    const atom = new FrameNumber(n);
    for (const receiver of [atom, new FrameArray([atom])]) {
      expect(receiver.sizeFor("####").toString()).toEqual(
        "$!.nonquantifiable-size .##",
      );
    }
  }
  const cycle = new FrameArray([]);
  cycle.collect(cycle);
  expect(cycle.sizeFor("####").toString()).toEqual("$!.cyclic-aggregate .##");
  const body: Frame[] = [];
  const syntax = new FrameExpr(body);
  body.push(syntax);
  expect(syntax.sizeFor("####").toString()).toEqual("$!.cyclic-aggregate .##");
  class Unread extends MemoryStore {
    public override read(): never {
      throw new Error("read");
    }
  }
  class Uncalled extends FrameLazy {
    public override elements(): never {
      throw new Error("enumerated");
    }
    public override call(): never {
      throw new Error("called");
    }
    public override in(): never {
      throw new Error("evaluated");
    }
  }
  const resource = FrameResource.root(new Unread()).extend("'./missing'");
  const closure = new Uncalled([new FrameCount(5n), new FrameCount(3n)]);
  const schema = new FrameSchema([closure], {}, {
    match(): never {
      throw new Error("matched");
    },
  });
  expect(encode(closure.sizeFor("####"))).toEqual([
    "all",
    "5",
    "3",
  ]);
  // A resource is an atom of Size 1: one terminal, observed without a read.
  expect(encode(resource.sizeFor("####"))).toEqual([
    "nil",
    "1",
    "0",
  ]);
  expect(schema.sizeFor("####")).toBe(Frame.nil);
  expect(encode(new FrameArray([resource, closure, schema]).sizeFor("####")))
    .toBeDefined();
  class Empty extends Frame {
    public override sizeFor(key: string): Frame {
      if (key === "#") return new FrameCount(0n);
      if (key === "####") return super.sizeFor(key);
      throw new Error("unneeded observation");
    }
  }
  expect(new Empty().sizeFor("####")).toBe(Frame.nil);
});

Deno.test("missing Count falls back to Size, and missing residual to Count parity (011.18m)", () => {
  class Sized extends Frame {
    public override nativeSize(): bigint {
      return 7n;
    }
  }
  const sized = new Sized();
  expect(sized.sizeFor("#").toString()).toEqual("7");
  expect(sized.sizeFor("###").toString()).toEqual("1");
  expect(encode(sized.sizeFor("####"))).toEqual([
    "nil",
    "4",
    "3",
  ]);
  class Invalid extends Frame {
    public override sizeFor(key: string): Frame {
      if (key === "#") return new FrameCount(1n);
      if (key === "##") return new FrameCount(2n);
      if (key === "###") return new FrameInt(1n);
      return super.sizeFor(key);
    }
  }
  expect(new Invalid().sizeFor("####").toString()).toEqual("$!.demi-coherence");
});

Deno.test("native append and Star commute with Demi application and scaling on pure shapes", () => {
  const shapes: FrameArray[] = [new FrameArray([])];
  for (let i = 0; i < 6; i++) {
    shapes.push(new FrameArray([shapes[i]]));
    shapes.push(new FrameArray([shapes[0], shapes[i]]));
  }
  // The empty host has no Demi; it lifts to the zero-load Demi in phase 2.
  const lifted = new FrameArray([new FrameCount(0n), new FrameCount(0n)])
    .sizeFor("####");
  expect(encode(lifted)).toEqual(["all", "0", "0"]);
  for (const x of shapes) {
    for (const y of shapes) {
      const dx = x.sizeFor("####");
      const dy = y.sizeFor("####");
      const k = y.sizeFor("##") as FrameCount;
      const appended = new FrameArray([...x.asArray(), y]).sizeFor("####");
      // (X Y).#### = X.#### Y, observing commutes with applying.
      const expectedAppend = deposit(dx === Frame.nil ? lifted : dx, y);
      expect(appended.equals(expectedAppend)).toBe(Frame.all);
      const inlaid = x.star(y).sizeFor("####");
      const expectedStar = dx === Frame.nil ? dy : scale(dx, k);
      expect(inlaid.equals(expectedStar)).toBe(Frame.all);
    }
  }
});
