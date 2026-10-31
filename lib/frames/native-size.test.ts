import { FrameHandle } from "./frame-handle.ts";
import { expect } from "jsr:@std/expect@^0.219.1";
import {
  Frame,
  FrameArray,
  FrameBlob,
  FrameBytes,
  FrameCount,
  FrameExpr,
  FrameGroup,
  FrameLazy,
  FrameNumber,
  FrameResource,
  FrameSchema,
  FrameString,
  FrameSymbol,
  MemoryStore,
  parseTimeLiteral,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

const last = (source: string): Frame =>
  evaluate(source).at(-1).asArray().at(-1)!;

Deno.test("Size evaluates exact truncated magnitudes without Number projection", () => {
  for (
    const [source, size] of [
      ["7.9", "7"],
      ["(-7.9)", "7"],
      ["(-3)", "3"],
      ["0.9", "0"],
      ["0", "0"],
      ["(-7 / 2)", "3"],
      ["(-1 / 2)", "0"],
      ["(7 / -2)", "3"],
      ["9007199254740993123456789", "9007199254740993123456789"],
      ["(-9007199254740993123456789.99)", "9007199254740993123456789"],
      ["(-90071992547409931234567899 / 10)", "9007199254740993123456789"],
    ]
  ) {
    const result = last(`${source}.##`);
    expect(result, source).toBeInstanceOf(FrameCount);
    expect(result.toString(), source).toEqual(size);
  }
  for (const value of [7.9, -7.9, 0.9, -0, 1e100]) {
    expect(new FrameNumber(value).sizeFor("##").toString())
      .toEqual(BigInt(Math.trunc(Math.abs(value))).toString());
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    const atom = new FrameNumber(value);
    expect(atom.sizeFor("##").toString()).toEqual(
      "$!.nonquantifiable-size .##",
    );
    expect(new FrameArray([atom]).sizeFor("##").toString())
      .toEqual("$!.nonquantifiable-size .##");
    expect(new FrameArray([atom]).sizeFor("###")).toBe(Frame.nil);
  }
});

Deno.test("text uses represented UTF-16 units; blobs use bits and payloads bytes", () => {
  for (
    const [source, size] of [
      ['""', "0"],
      ['"hello"', "5"],
      ['"é😀"', "3"],
      ['"é"', "2"],
      ["`é😀`", "3"],
      ["0b0001", "4"],
      ["0x00ff", "16"],
      ["\\0\\", "0"],
      ["\\3\\abc", "3"],
    ]
  ) {
    expect(last(`${source}.##`).toString(), source).toEqual(size);
  }
  expect(new FrameBytes([]).sizeFor("##").toString()).toEqual("0");
  expect(new FrameBytes([0, 255]).sizeFor("##").toString()).toEqual("2");
  const blob = new FrameBlob("0b0001");
  expect(blob.sizeFor("##").toString()).toEqual("4");
  expect(blob.toString()).toEqual("0b0001");
  // There is no valid zero-width blob constructor/literal; empty bytes cover zero.
});

Deno.test("types and schemas count descriptions or declared alternatives", () => {
  for (
    const [source, size] of [
      ["(1).<>", "1"],
      ["<>", "1"],
      ["()", "1"],
      ["<2, 3, 5>", "3"],
      ["<2, 2, [3, 5]>", "3"],
      ["<<2, 3>, 5>", "2"],
      ["<.a, .b>", "1"],
      ["<8 @Bit>", "1"],
      ["<(1).<>>", "1"],
    ]
  ) expect(last(`${source}.##`).toString(), source).toEqual(size);
  let effects = 0;
  class Candidate extends Frame {
    public override in(): Frame {
      effects++;
      return this;
    }
    public override nativeSize(): bigint {
      effects++;
      return 999n;
    }
  }
  const candidate = new Candidate();
  const schema = new FrameSchema([
    candidate,
    candidate,
    new FrameArray([candidate]),
  ]);
  expect(schema.sizeFor("##").toString()).toEqual("3");
  expect(schema.sizeFor("###")).toBe(Frame.nil);
  expect(effects).toEqual(0);
  expect(new FrameSchema([]).sizeFor("##").toString()).toEqual("1");
  const terms: Frame[] = [];
  const cyclicCandidate = new FrameExpr(terms);
  terms.push(cyclicCandidate);
  expect(
    new FrameSchema([cyclicCandidate, cyclicCandidate]).sizeFor("##")
      .toString(),
  )
    .toEqual("2");
});

Deno.test("mixed arrays and evaluated groups alternate complete immediate Sizes", () => {
  for (
    const [source, size, residual, count] of [
      ['[5, "hello"]', "10", "0", "2"],
      ['[5, 3, "ab"]', "10", "4", "3"],
      ['[5, 3, "ab", 7]', "17", "-3", "4"],
      ['[[5, "ab"], [3, []], 2]', "13", "5", "3"],
      ['(5, "hello")', "10", "0", "2"],
      ['(.k 999; 5, "ab")', "7", "3", "2"],
      ['[.k 999; 5, "ab"]', "7", "3", "2"],
      ["[<2, 3, 5>, 2]", "5", "1", "2"],
      ["[]", "1", "0", "0"],
      ["[0, 0]", "0", "0", "2"],
    ]
  ) {
    expect(last(`${source}.##`).toString(), source).toEqual(size);
    const signed = last(`${source}.###`);
    expect(signed.className()).toEqual("FrameInt");
    expect(signed.toString(), source).toEqual(residual);
    expect(last(`${source}.#`).toString(), source).toEqual(count);
  }
  for (
    const source of [
      "5",
      "(-3)",
      '"hi"',
      "(1).<>",
      "<2,3>",
      "{5,3}",
      "<>",
      "()",
    ]
  ) {
    expect(evaluate(`${source}.###`).toString(), source).toEqual("[]");
  }
  expect(new FrameExpr([new FrameCount(5n), new FrameCount(3n)]).sizeFor("###"))
    .toBe(Frame.nil);
  const sourceArray = new FrameArray([new FrameCount(5n)]);
  sourceArray.is.source = true;
  expect(sourceArray.sizeFor("###")).toBe(Frame.nil);
});

Deno.test("recursive Size distinguishes sharing, mutual cycles, and metadata cycles", () => {
  const child = new FrameArray([new FrameCount(5n), new FrameString("ab")]);
  const handle = new FrameHandle(child, false);
  const root = new FrameArray([handle, child, new FrameArray([handle])]);
  root.set("self", root);
  expect(root.sizeFor("##").toString()).toEqual("21");
  expect(root.sizeFor("###").toString()).toEqual("7");
  expect(handle.sizeFor("##").toString()).toEqual("7");
  expect(handle.sizeFor("###").toString()).toEqual("3");
  expect(root.asArray()).toEqual([handle, child, root.at(2)]);
  expect(handle.unwrap()).toBe(child);
  for (const length of [2, 3]) {
    const nodes = Array.from({ length }, () => new FrameArray([]));
    nodes.forEach((node, index) =>
      node.collect(new FrameHandle(nodes[(index + 1) % length], false))
    );
    for (const node of nodes) {
      expect(node.sizeFor("##").toString()).toEqual("$!.cyclic-aggregate .##");
      expect(node.sizeFor("###")).toBe(Frame.nil);
      expect(node.sizeFor("#").toString()).toEqual("1");
      expect(node.asArray()).toHaveLength(1);
    }
  }
  // Syntax walks must refuse cycles without registering evaluation sites first.
  const body: Frame[] = [];
  const closure = new FrameLazy(body);
  const containing = new FrameArray([closure]);
  body.push(containing);
  expect(closure.sizeFor("##").toString()).toEqual("$!.cyclic-aggregate .##");
  expect(containing.sizeFor("###")).toBe(Frame.nil);
  const syntax: Frame[] = [];
  const expr = new FrameExpr(syntax);
  syntax.push(expr);
  expect(expr.sizeFor("##").toString()).toEqual("$!.cyclic-aggregate .##");
  const a: Frame[] = [];
  const group = new FrameGroup(a);
  a.push(group);
  expect(group.sizeFor("##").toString()).toEqual("$!.cyclic-aggregate .##");
  expect(group.sizeFor("###")).toBe(Frame.nil);
});

Deno.test("observation neither executes, matches nor reads resources", () => {
  class UnreadStore extends MemoryStore {
    public override read(): never {
      throw new Error("unexpected resource read");
    }
    public override write(): never {
      throw new Error("unexpected resource write");
    }
  }
  class Uncalled extends FrameLazy {
    public override call(): never {
      throw new Error("unexpected closure call");
    }
  }
  const resource = FrameResource.root(new UnreadStore()).extend("'./missing'");
  const closure = new Uncalled([new FrameCount(5n), FrameSymbol.for("+")]);
  const matcher = new FrameSchema([], {}, {
    match(): never {
      throw new Error("unexpected match");
    },
  });
  const opaque = [
    resource,
    Frame.error("$!.example"),
    FrameSymbol.for("+"),
    parseTimeLiteral("2026-10-30"),
    parseTimeLiteral("PT1.5S"),
    matcher,
  ];
  for (const atom of opaque) expect(atom.sizeFor("##").toString()).toEqual("1");
  expect(last("9.8.m.##").toString()).toEqual("1");
  expect(last("1.2.3.##").toString()).toEqual("1");
  expect(closure.sizeFor("##").toString()).toEqual("6");
  expect(closure.sizeFor("###")).toBe(Frame.nil);
  expect(new FrameArray([...opaque, closure]).sizeFor("##").toString()).toEqual(
    "12",
  );
  expect(new FrameArray([resource, closure, matcher]).sizeFor("###").toString())
    .toEqual("-4");
});
