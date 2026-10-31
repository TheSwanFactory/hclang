import { expect } from "jsr:@std/expect@^0.219.1";
import * as f from "../frames.ts";
import { BoundMethod } from "./bound-method.ts";
import { FrameHandle } from "./frame-handle.ts";

// Compatibility evidence, not a fourth observer. Nil here records a missing
// integer observation; it must never be converted to a numerical zero.
const observations = (value: f.Frame): string[] =>
  ["#", "##", "###"].map((key) => {
    const result = value.sizeFor(key);
    return result === f.Frame.nil ? "nil" : result.toString();
  });

Deno.test("Demi compatibility matrix: all concrete Frame families stay non-executing", () => {
  const c = new f.FrameCount(5n);
  const array = new f.FrameArray([c, new f.FrameCount(3n)]);
  const closure = new f.FrameLazy([c, new f.FrameCount(3n)]);
  const resource = f.FrameResource.root(new f.MemoryStore()).extend(
    "'./missing'",
  );
  const opaque: f.Frame[] = [
    new f.Frame(),
    new f.FrameAtom(),
    f.Frame.nil,
    f.Frame.all,
    f.Frame.missing,
    f.Frame.error("$!.stored"),
    new f.FrameArg("_"),
    f.FrameParam.level(),
    new f.FrameName("name"),
    new f.FrameWord("name", false),
    new f.FrameAlias("name"),
    new f.FrameLiteral(() => {
      throw new Error("rendered echo");
    }),
    f.FrameSymbol.for("+"),
    new f.FrameOperator("+"),
    new f.FrameNote("!"),
    new f.FrameStringEnd(),
    new f.FrameBytePayload(2),
    new f.FrameComment("comment"),
    new f.FrameURI("'./missing'"),
    resource,
    f.FrameScopeAnchor.host(),
    f.FrameScopeAnchor.file(),
    new f.FrameImport({ kind: "local" }, resource, () => {
      throw new Error("imported");
    }),
    new BoundMethod(closure, array, false, { name: "m", mutating: false }),
    f.FrameType.of(c),
    new f.FrameTypedNumber(new f.FrameDecimal("9.8"), "m"),
    new f.FrameSequence("1.2.3"),
    f.parseTimeLiteral("2026-10-30"),
    f.parseTimeLiteral("PT1.5S"),
    new f.FrameDemi(f.Frame.nil, c, new f.FrameCount(0n)),
  ];
  for (const value of opaque) {
    const failure = value.observationError();
    if (failure) {
      expect(observations(value)).toEqual([
        failure.toString(),
        failure.toString(),
        failure.toString(),
      ]);
      expect(value.sizeFor("####")).toBe(failure);
      continue;
    }
    const n = value instanceof f.FrameAtom || value instanceof f.FrameType ||
        value === f.Frame.nil || value === f.Frame.all ||
        value === f.Frame.missing
      ? "0"
      : "1";
    expect(observations(value), value.className()).toEqual([n, "1", "nil"]);
    expect(value.sizeFor("####")).toBe(f.Frame.nil);
  }
  const rows: [f.Frame, string[]][] = [
    [new f.FrameCount(0n), ["0", "0", "0"]],
    [c, ["5", "5", "1"]],
    [new f.FrameInt(-3n), ["0", "3", "nil"]],
    [new f.FrameDecimal("-7.9"), ["0", "7", "nil"]],
    [new f.FrameRational(-7n, 2n), ["0", "3", "nil"]],
    [new f.FrameNumber(7.9), ["0", "7", "nil"]],
    [new f.FrameNumber(Infinity), [
      "$!.nonquantifiable-size .##",
      "$!.nonquantifiable-size .##",
      "$!.nonquantifiable-size .##",
    ]],
    [new f.FrameString("é😀"), ["0", "2", "nil"]],
    [new f.FrameString(""), ["0", "0", "nil"]],
    [new f.FrameDoc("é😀"), ["0", "2", "nil"]],
    [new f.FrameBlob("0b0001"), ["0", "4", "nil"]],
    [new f.FrameBytes([0, 255]), ["0", "2", "nil"]],
    [new f.FrameBytes([]), ["0", "0", "nil"]],
    [array, ["2", "8", "2"]],
    [new f.FrameArray([]), ["0", "1", "0"]],
    [new f.FrameArray([new f.FrameCount(0n)]), ["1", "0", "0"]],
    [new f.FrameGroup([c, new f.FrameCount(3n)]), ["2", "8", "2"]],
    [new f.FrameList([c, new f.FrameCount(3n)]), ["2", "8", "2"]],
    [new f.FrameExpr([c, new f.FrameCount(3n)]), ["2", "8", "2"]],
    [new f.FrameBind([c, new f.FrameCount(3n)]), ["2", "8", "2"]],
    [closure, ["2", "8", "2"]],
    [new f.FrameSchema([c, new f.FrameCount(3n)]), ["2", "2", "nil"]],
    [new f.FrameSchema([]), ["0", "1", "nil"]],
    [
      new f.FrameSchema([c], {}, {
        match(): never {
          throw new Error("matched");
        },
      }),
      ["1", "1", "nil"],
    ],
    [new FrameHandle(array, false), ["2", "8", "2"]],
    [new f.FrameScoped(array, f.EvaluationScope.from([])), ["2", "8", "2"]],
  ];
  for (const [value, expected] of rows) {
    expect(observations(value), value.className()).toEqual(expected);
    const observed = value.sizeFor("####");
    if (expected[0].startsWith("$!")) {
      expect(observed.toString()).toEqual(expected[0]);
    } else if (expected[0] === "0" || expected[2] === "nil") {
      expect(observed).toBe(f.Frame.nil);
    } else {
      expect(observed).toBeInstanceOf(f.FrameDemi);
      const d = observed as f.FrameDemi;
      expect(d.left.data + d.right.data).toEqual(BigInt(expected[1]));
      expect(d.left.data - d.right.data).toEqual(BigInt(expected[2]));
      expect(d.orientation).toBe(
        BigInt(expected[0]) % 2n === 0n ? f.Frame.all : f.Frame.nil,
      );
    }
  }
  for (const value of [new f.FrameArray([c]), new f.FrameGroup([c])]) {
    value.is.source = true;
    expect(observations(value), value.className()).toEqual(["1", "5", "5"]);
  }
});

Deno.test("Demi cycles propagate errors while shared descendants stay coherent", () => {
  const cycle = new f.FrameArray([]);
  cycle.collect(cycle);
  expect(observations(cycle)).toEqual([
    "1",
    "$!.cyclic-aggregate .##",
    "$!.cyclic-aggregate .##",
  ]);
  const shared = new f.FrameArray([new f.FrameCount(3n)]);
  const parent = new f.FrameArray([shared, shared]);
  parent.set("self", parent);
  expect(observations(parent)).toEqual(["2", "6", "0"]);
  shared.collect(new f.FrameCount(2n));
  expect(observations(parent)).toEqual(["2", "10", "0"]);
});
