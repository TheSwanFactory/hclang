import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { evaluate } from "../execute/evaluate.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import {
  footprintsConflict,
  isOpaque,
  type PotentialFootprint,
  potentialFootprint,
} from "./access-footprint.ts";

const PROGRAM = `
.x_ [.n 5; .set_ {@n _;}; .get {n}; .inner_ [.k 0; .bump_ {@k (k + 1);}]];
.y_ [.n 10; .set_ {@n _;}];
.z x_;
.incr-x {.a x_.n; x_.set_ (a + 1);};
.incr-y {.a y_.n; y_.set_ (a + 1);};
.read-x {x_.n};
.poke-inner {x_.inner_.bump_ ()};
.alias-write {.w_ x_; w_.set_ 99};
.move {.v x_.n; x_.set_ (v - 1); y_.set_ (y_.n + 1);};
.sum {x_.n + y_.n};
.pass-on {sink x_};
.sink {_};
.ghost {nowhere.set_ 1};
.lexical-bump {@counter (counter + 1)};
.counter 0;
.rebind {@x_ y_};
.via-arg {(_ .0).set_ 7};
`;

/** A program, its identities, and names read as a statement would read them. */
const program = (): {
  scope: Frame;
  name: (frame: Frame) => string;
  read: (key: string) => Frame;
  footprint: (key: string, argument?: Frame) => PotentialFootprint;
} => {
  const scope = evaluate(PROGRAM);
  const x = scope.get_here("x_");
  const y = scope.get_here("y_");
  const inner = x.get_here("inner_");
  const name = (frame: Frame): string =>
    frame === x
      ? "x"
      : frame === y
      ? "y"
      : frame === inner
      ? "x.inner"
      : frame === scope
      ? "file"
      : frame.id;
  const read = (key: string): Frame =>
    FrameSymbol.for(key).in(EvaluationScope.root(scope));
  const footprint = (key: string, argument = Frame.nil): PotentialFootprint =>
    potentialFootprint(read(key), argument);
  return { scope, name, read, footprint };
};

const names = (
  frames: ReadonlySet<Frame>,
  name: (frame: Frame) => string,
): string[] => [...frames].map(name).sort();

describe("potential footprint: what a body's names may touch", () => {
  it("marks a marked name's referent writable when a mutating method follows", () => {
    const { footprint, name } = program();
    const fp = footprint("incr-x");
    expect(names(fp.writes, name)).toEqual(["x", "x.inner"]);
    expect(names(fp.reads, name)).toEqual(["file", "x", "x.inner"]);
    expect(isOpaque(fp)).toBe(false);
  });

  it("keeps disjoint identities disjoint", () => {
    const { footprint, name } = program();
    expect(names(footprint("incr-y").writes, name)).toEqual(["y"]);
    expect(names(footprint("incr-y").reads, name)).toEqual(["file", "y"]);
    expect(footprintsConflict(footprint("incr-x"), footprint("incr-y"))).toBe(
      false,
    );
  });

  it("treats a field read through a marked name as a read", () => {
    const { footprint, name } = program();
    const fp = footprint("read-x");
    expect(names(fp.writes, name)).toEqual([]);
    expect(names(fp.reads, name)).toEqual(["file", "x", "x.inner"]);
    expect(names(footprint("sum").writes, name)).toEqual([]);
  });

  it("follows a nested callee to the member it writes", () => {
    const { footprint, name } = program();
    const fp = footprint("poke-inner");
    expect(names(fp.writes, name)).toEqual(["x.inner"]);
    expect(names(fp.reads, name)).toEqual(["file", "x", "x.inner"]);
  });

  it("counts a marked local declaration as minting write authority", () => {
    const { footprint, name } = program();
    expect(names(footprint("alias-write").writes, name)).toEqual([
      "x",
      "x.inner",
    ]);
  });

  it("counts a marked name handed on whole as a write", () => {
    const { footprint, name } = program();
    expect(names(footprint("pass-on").writes, name)).toEqual(["x", "x.inner"]);
  });

  it("spans every identity a multi-value body writes", () => {
    const { footprint, name } = program();
    expect(names(footprint("move").writes, name)).toEqual([
      "x",
      "x.inner",
      "y",
    ]);
  });

  it("writes the binding owner, not its members, for a lexical alias write", () => {
    const { footprint, name } = program();
    const fp = footprint("lexical-bump");
    expect(names(fp.writes, name)).toEqual(["file"]);
    expect(names(fp.reads, name)).toEqual(["file"]);
    // Rebinding `x_` hands `y_`'s referent to a mutable binding, so it may be
    // written through that binding later: the walk counts it as a write.
    const rebind = footprint("rebind");
    expect(names(rebind.writes, name)).toEqual(["file", "y"]);
  });

  it("reads the argument and resolves a path through it at dispatch time", () => {
    const { footprint, name, scope } = program();
    const fp = footprint("via-arg", new FrameArray([scope.get_here("z")]));
    expect(names(fp.writes, name)).toEqual(["x", "x.inner"]);
  });

  it("is opaque when a name does not resolve", () => {
    const { footprint } = program();
    const fp = footprint("ghost");
    expect(isOpaque(fp)).toBe(true);
    expect(fp.unresolved).toEqual(["nowhere"]);
    expect(footprint("via-arg").unresolved).toEqual([]);
    expect(footprintsConflict(fp, footprint("incr-y"))).toBe(true);
  });

  it("writes the receiver of a mutating method through a mutable handle", () => {
    const { read, name } = program();
    const fp = potentialFootprint(
      read("x_").get("set_"),
      FrameCount.for("1"),
    );
    expect(names(fp.writes, name)).toEqual(["x", "x.inner"]);
  });

  it("does not write the original for a functional update through an immutable handle", () => {
    const { read, name, scope } = program();
    const fp = potentialFootprint(read("z").get("set_"), FrameCount.for("1"));
    expect(fp.writes.has(scope.get_here("x_"))).toBe(false);
    expect(names(fp.writes, name)).toEqual([]);
    expect(names(fp.reads, name)).toContain("x.inner");
  });

  it("is opaque for a target that has no code to walk", () => {
    const fp = potentialFootprint(FrameCount.for("1"));
    expect(isOpaque(fp)).toBe(true);
  });
});

describe("footprint conflict", () => {
  const frame = (): Frame => new Frame();
  const fp = (reads: Frame[], writes: Frame[]): PotentialFootprint => ({
    reads: new Set(reads),
    writes: new Set(writes),
    unresolved: [],
  });

  it("is a write meeting a read or a write, never two reads", () => {
    const x = frame();
    const y = frame();
    expect(footprintsConflict(fp([x], []), fp([x], []))).toBe(false);
    expect(footprintsConflict(fp([x], [x]), fp([x], []))).toBe(true);
    expect(footprintsConflict(fp([x], []), fp([x], [x]))).toBe(true);
    expect(footprintsConflict(fp([x], [x]), fp([y], [y]))).toBe(false);
    expect(footprintsConflict(fp([x], [x]), fp([x], [x]))).toBe(true);
  });
});
