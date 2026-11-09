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
import { constructDenum } from "../execute/denum-prologue.ts";
import { FrameHandle } from "./frame-handle.ts";

const last = (source: string): Frame =>
  evaluate(source).at(-1).asArray().at(-1)!;

/** The value of a one-expression source that answers an aggregate, a Denum. */
const value = (source: string): Frame =>
  FrameExpr.answeredValue(evaluate(source).at(-1)).referent();

/**
 * A binary Denum's state as the retired native encoding spelled it,
 * orientation then loads. It is read from the two fields the HC instance
 * stores, `count` and `loads` (007.40), with the orientation the Count's
 * parity; undefined when the value is not a binary Denum.
 */
const encode = (
  value: Frame,
): readonly [string, string, string] | undefined => {
  const count = value.getOwn("count");
  const stored = value.getOwn("loads");
  if (count.is.missing || stored.is.missing) return undefined;
  const elements = stored.referent().elements();
  if (elements.length !== 2) return undefined;
  const even = BigInt(`${count}`) % 2n === 0n;
  return [even ? "all" : "nil", `${elements[0]}`, `${elements[1]}`];
};

/** The full Count a Denum keeps (007.25c), as a bigint. */
const countOf = (value: Frame): bigint => BigInt(`${value.getOwn("count")}`);

/** The loads and phase of a Denum, as bigints and the orientation. */
const loads = (
  value: Frame,
): { left: bigint; right: bigint; even: boolean } => {
  const state = encode(value);
  if (!state) throw new Error(`not a Denum: ${value}`);
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
    const denum = value.sizeFor("####");
    if (n === 0n) {
      expect(denum).toBe(Frame.nil);
    } else {
      const d = loads(denum);
      expect(d.left + d.right).toEqual(n);
      expect(d.left - d.right).toEqual(n % 2n);
      expect(d.even).toBe(n % 2n === 0n);
      // The Count is kept whole, not reduced to its parity (007.25c).
      expect(countOf(denum)).toEqual(n);
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
  // The same fourth hashes keep the whole source Count, not its parity.
  for (
    const [source, n] of [
      ["1", 1n],
      ["“hello”", 5n],
      ["7.9", 7n],
      ["(-7)", 7n],
      ["(10 - 5)", 5n],
      ["2", 2n],
      ["3", 3n],
      ["7", 7n],
      ["[0]", 1n],
      ["[0,0]", 2n],
      ["[“hello”]", 1n],
      ["[<2,3,5>,2]", 2n],
      ["{5 + 3}", 3n],
      ["(5,3)", 2n],
    ] as const
  ) {
    expect(countOf(value(`${source}.####`)), source).toEqual(n);
    expect(value(`${source}.####.#`).toString(), source).toEqual(`${n}`);
  }
  // Same phase and loads, different Counts: different Denums.
  expect(
    value("[5, 3].####").equals(value("[5, 3, 0, 0].####")),
  ).toBe(Frame.nil);
  expect(
    value("([5, 3].####.left ()) = ([5, 3, 0, 0].####.left ())").toString(),
  ).toEqual("<>");
  // Deposit is application and scaling a method; the Denum class also declares
  // the arithmetic operators as methods, so `+` deposits on the right and `*`
  // scales, each answering a fresh Denum rather than nil or a Star refusal
  // (015.02).
  expect(value("“” ([[],[]].#### 3)").toString()).toEqual("“Denum(3,4,1)”");
  expect(value("“” (7.####.scale_ 2)").toString()).toEqual("“Denum(7,8,6)”");
  expect(value("“” ([[],[]].#### + 3)").toString()).toEqual("“Denum(2,1,4)”");
  expect(value("“” (7.#### * 2)").toString()).toEqual("“Denum(7,8,6)”");
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

Deno.test("derived Denum obeys projections over nested mixed values, sharing and bigint Counts", () => {
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
      expect(countOf(receiver.sizeFor("####"))).toEqual(n.data);
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
  expect(new Invalid().sizeFor("####").toString()).toEqual(
    "$!.denum-coherence",
  );
});

Deno.test("native append and Star commute with Denum application and scaling on pure shapes", () => {
  const shapes: FrameArray[] = [new FrameArray([])];
  for (let i = 0; i < 6; i++) {
    shapes.push(new FrameArray([shapes[i]]));
    shapes.push(new FrameArray([shapes[0], shapes[i]]));
  }
  // The empty host has no Denum; it lifts to the Denum of Count zero, which is
  // present (007.25c), where the two zero children of `[0, 0]` are Count two.
  const lifted = constructDenum(
    new FrameCount(0n),
    new FrameCount(0n),
    new FrameCount(0n),
  );
  expect(encode(lifted)).toEqual(["all", "0", "0"]);
  expect(countOf(lifted)).toEqual(0n);
  expect(
    countOf(
      new FrameArray([new FrameCount(0n), new FrameCount(0n)]).sizeFor("####"),
    ),
  ).toEqual(2n);
  for (const x of shapes) {
    for (const y of shapes) {
      const dx = x.sizeFor("####");
      const dy = y.sizeFor("####");
      const k = y.sizeFor("##") as FrameCount;
      const appended = new FrameArray([...x.asArray(), y]).sizeFor("####");
      // (X Y).#### = X.#### Y, observing commutes with applying.
      const expectedAppend = deposit(dx === Frame.nil ? lifted : dx, y);
      expect(appended.equals(expectedAppend)).toBe(Frame.all);
      // Application adds exactly one to the Count (007.25c).
      expect(countOf(appended)).toEqual(
        dx === Frame.nil ? 1n : countOf(dx) + 1n,
      );
      const inlaid = x.star(y).sizeFor("####");
      const expectedStar = dx === Frame.nil ? dy : scale(dx, k);
      expect(inlaid.equals(expectedStar)).toBe(Frame.all);
      // Star keeps the Count of a nonempty host.
      if (dx !== Frame.nil) expect(countOf(inlaid)).toEqual(countOf(dx));
    }
  }
});
