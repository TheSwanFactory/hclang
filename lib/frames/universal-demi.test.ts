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
  FrameDemi,
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

Deno.test("sized values inherit Count from Size without installing a residual", () => {
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
      FrameType.of(new FrameCount(5n)),
    ]
  ) {
    const count = value.sizeFor("#");
    expect(count).toBeInstanceOf(FrameCount);
    expect((count as FrameCount).data).toEqual(
      (value.sizeFor("##") as FrameCount).data,
    );
    expect(value.sizeFor("###")).toBe(Frame.nil);
    expect(value.sizeFor("####")).toBe(Frame.nil);
  }
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
      "“hello”",
      "7.9",
      "(-7)",
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
    const value = last(`${source}.####`);
    expect(value, source).toBeInstanceOf(FrameDemi);
    expect((value as FrameDemi).encode(), source).toEqual(encoding);
  }
  expect(last("[[],[]].#### + 3").toString()).toEqual("FrameDemi((),4,1)");
  expect(last("7.#### * 2").toString()).toEqual("FrameDemi((),8,6)");
  for (const singleton of ["()", "<>"]) {
    expect(last(`${singleton}.#`).toString()).toEqual("0");
  }
  for (const value of [Frame.nil, Frame.all, Frame.missing]) {
    const copy = value.copy();
    copy.set("label", new FrameString("metadata"));
    expect(copy.sizeFor("#").toString()).toEqual("0");
    expect(copy.sizeFor("####")).toBe(Frame.nil);
  }
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
      const state = receiver.sizeFor("####") as FrameDemi;
      expect(state).toBeInstanceOf(FrameDemi);
      const n = receiver.sizeFor("#") as FrameCount;
      const s = receiver.sizeFor("##") as FrameCount;
      const r = receiver.sizeFor("###") as FrameInt;
      expect(state.left.data + state.right.data).toEqual(s.data);
      expect(state.left.data - state.right.data).toEqual(r.data);
      expect(state.orientation).toBe(
        n.data % 2n === 0n ? Frame.all : Frame.nil,
      );
    }
  }
  const parent = new FrameArray([shared]);
  const first = parent.sizeFor("####") as FrameDemi;
  shared.collect(new FrameCount(2n));
  expect((parent.sizeFor("####") as FrameDemi).left.data).toEqual(
    first.left.data + 2n,
  );
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
  expect((closure.sizeFor("####") as FrameDemi).encode()).toEqual([
    "all",
    "5",
    "3",
  ]);
  expect(resource.sizeFor("####")).toBe(Frame.nil);
  expect(schema.sizeFor("####")).toBe(Frame.nil);
  expect(new FrameArray([resource, closure, schema]).sizeFor("####"))
    .toBeInstanceOf(FrameDemi);
  class Empty extends Frame {
    public override sizeFor(key: string): Frame {
      if (key === "#") return new FrameCount(0n);
      if (key === "####") return super.sizeFor(key);
      throw new Error("unneeded observation");
    }
  }
  expect(new Empty().sizeFor("####")).toBe(Frame.nil);
});

Deno.test("missing Count falls back to Size, but does not install a residual", () => {
  class Sized extends Frame {
    public override nativeSize(): bigint {
      return 7n;
    }
  }
  const sized = new Sized();
  expect(sized.sizeFor("#").toString()).toEqual("7");
  expect(sized.sizeFor("###")).toBe(Frame.nil);
  expect(sized.sizeFor("####")).toBe(Frame.nil);
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

Deno.test("native append and Star commute with Demi scalar laws on pure shapes", () => {
  const shapes: FrameArray[] = [new FrameArray([])];
  for (let i = 0; i < 6; i++) {
    shapes.push(new FrameArray([shapes[i]]));
    shapes.push(new FrameArray([shapes[0], shapes[i]]));
  }
  for (const x of shapes) {
    for (const y of shapes) {
      const dx = x.sizeFor("####");
      const dy = y.sizeFor("####");
      const k = y.sizeFor("##") as FrameCount;
      const appended = new FrameArray([...x.asArray(), y]).sizeFor("####");
      const expectedAppend = dx === Frame.nil
        ? new FrameDemi(Frame.nil, k, new FrameCount(0n))
        : (dx as FrameDemi).addCount(k);
      expect(appended.equals(expectedAppend)).toBe(Frame.all);
      const inlaid = x.star(y).sizeFor("####");
      const expectedStar = dx === Frame.nil
        ? dy
        : (dx as FrameDemi).multiplyCount(k);
      expect(inlaid.equals(expectedStar)).toBe(Frame.all);
    }
  }
});
