import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { evaluate } from "../execute/evaluate.ts";
import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameCount } from "./frame-count.ts";
import { FrameExpr, FrameScoped } from "./frame-expr.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameResource } from "./frame-resource.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect } from "./effect-marker.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import { dispatch } from "./event-dispatch.ts";
import { MemoryStore } from "./resource-store.ts";
import { RESOURCE_ROOT_KEY } from "./resource-binding.ts";
import {
  footprintsConflict,
  isOpaque,
  isState,
  type PotentialFootprint,
  potentialFootprint,
} from "./access-footprint.ts";
import { readName } from "../test-helpers.test.ts";

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
  const read = (key: string): Frame => readName(scope, key);
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

const WALK = `
.x_ [.n 5; .set_ {@n _;}; .who {_^.n}; .poke_ {_^.set_ 1}; .inner_ [.k 0]];
.y_ [.n 10; .set_ {@n _;}];
.z x_;
.P [.tag 1];
.c [.^ P; .v 2];
.sink {_};
.apply {_ ()};
.pair {.q (x_, y_)};
.one {.q (x_)};
.hand-on {.w_ x_; sink w_};
.mark-unknown {.b_ nowhere};
.add-unknown {nowhere + 1};
.alias-unknown {@nowhere 1};
.group-unknown {(nowhere)};
.tight-unknown {sink nowhere.k};
.local-unknown {.l nowhere; l};
.ladder {x_.n + .};
.parents {c .^};
.inner-of {x_.inner_};
.pass-inner {sink x_.inner_};
.holder {{x_.set_ 1}};
.empty {};
`;

/** The walk program, with names for the identities the tests name. */
const walkProgram = (): {
  scope: Frame;
  x: Frame;
  name: (frame: Frame) => string;
  read: (key: string) => Frame;
} => {
  const scope = evaluate(WALK);
  const named = new Map<Frame, string>([
    [scope, "file"],
    [scope.get_here("x_"), "x"],
    [scope.get_here("x_").get_here("inner_"), "x.inner"],
    [scope.get_here("y_"), "y"],
    [scope.get_here("P"), "P"],
    [scope.get_here("c"), "c"],
  ]);
  return {
    scope,
    x: scope.get_here("x_"),
    name: (frame) => named.get(frame) ?? frame.id,
    read: (key) => readName(scope, key),
  };
};

describe("potential footprint: rare walk paths (#524)", () => {
  it("walks each term of a tuple and a one-term group as the path inside it", () => {
    const { read, name } = walkProgram();
    const pair = potentialFootprint(read("pair"));
    expect(names(pair.writes, name)).toEqual(["x", "x.inner", "y"]);
    expect(isOpaque(pair)).toBe(false);
    const one = potentialFootprint(read("one"));
    expect(names(one.writes, name)).toEqual(["x", "x.inner"]);
    expect(isOpaque(one)).toBe(false);
  });

  it("writes a marked local's referent when the local is handed on whole", () => {
    const { read, name } = walkProgram();
    const fp = potentialFootprint(read("hand-on"));
    expect(names(fp.writes, name)).toEqual(["x", "x.inner"]);
    expect(isOpaque(fp)).toBe(false);
  });

  it("refuses an unknown value bound to a marked name, and the name", () => {
    const { read } = walkProgram();
    expect(potentialFootprint(read("mark-unknown")).unresolved).toEqual([
      "nowhere",
      ".b_ <unknown>",
    ]);
  });

  it("refuses an unknown local once, where it was read", () => {
    const { read } = walkProgram();
    expect(potentialFootprint(read("local-unknown")).unresolved).toEqual([
      "nowhere",
      "l",
    ]);
  });

  it("keeps a refused path refused through an operator, a group and a tight expression", () => {
    const { read } = walkProgram();
    for (const key of ["add-unknown", "group-unknown", "tight-unknown"]) {
      const fp = potentialFootprint(read(key));
      expect(fp.unresolved).toEqual(["nowhere"]);
      expect(fp.writes.size).toBe(0);
    }
  });

  it("refuses an alias that names no binding", () => {
    const { read } = walkProgram();
    const fp = potentialFootprint(read("alias-unknown"));
    expect(fp.unresolved).toEqual(["@nowhere"]);
    expect(fp.writes.size).toBe(0);
  });

  it("reads the call's own parameter, not state, for the parameter ladder", () => {
    const { read, name } = walkProgram();
    const fp = potentialFootprint(read("ladder"));
    expect(names(fp.reads, name)).toEqual(["file", "x", "x.inner"]);
    expect(names(fp.writes, name)).toEqual([]);
    expect(isOpaque(fp)).toBe(false);
  });

  it("reads the declared parents of a path for `.^` off method position", () => {
    const { read, name } = walkProgram();
    const fp = potentialFootprint(read("parents"));
    expect(names(fp.reads, name)).toEqual(["P", "c", "file"]);
    expect(names(fp.writes, name)).toEqual([]);
    expect(isOpaque(fp)).toBe(false);
  });

  it("resolves `_^` to the receiver, with the authority the call holds", () => {
    const { read, name } = walkProgram();
    const who = potentialFootprint(read("x_").get("who"));
    expect(names(who.reads, name)).toEqual(["x", "x.inner"]);
    expect(names(who.writes, name)).toEqual([]);
    const poke = potentialFootprint(read("x_").get("poke_"));
    expect(names(poke.writes, name)).toEqual(["x", "x.inner"]);
    // Through an immutable handle the call is a functional update.
    const functional = potentialFootprint(read("z").get("poke_"));
    expect(names(functional.writes, name)).toEqual([]);
    expect(isOpaque(functional)).toBe(false);
  });

  it("touches nothing when the bound method refuses the call before its body", () => {
    const { x } = walkProgram();
    // A mutable binding inside a functional update whose copy-on-write graph
    // does not hold the receiver: the call meets the boundary.
    const method = new BoundMethod(
      x.get_here("set_") as FrameLazy,
      x,
      true,
      methodEffect("set_"),
      new WeakSet<Frame>(),
    );
    const fp = potentialFootprint(method, FrameCount.for("7"));
    expect(fp.reads.size).toBe(0);
    expect(fp.writes.size).toBe(0);
    expect(isOpaque(fp)).toBe(false);
    expect(method.call(FrameCount.for("7")).toString()).toEqual(
      "$!.copy-on-write-boundary .set",
    );
    expect(x.get_here("n").toString()).toEqual("5");
  });

  it("does not admit the write of a walked closure atom handed in as the argument", () => {
    const { read, x } = walkProgram();
    const [atom] = read("holder").elements();
    expect(atom).toBeInstanceOf(FrameScoped);
    const fp = potentialFootprint(read("apply"), atom);
    const outcome = dispatch(
      [{ label: "apply", target: read("apply"), argument: atom }],
      "sequential",
    ).outcomes[0];
    // The call writes `x_`, so the footprint must say so or be opaque.
    expect(x.get_here("n").toString()).toEqual("1");
    expect(outcome.actual.sharedWrites()).toContain(x);
    expect(isOpaque(fp) || fp.writes.has(x)).toBe(true);
  });

  it("walks a body holding a walk's scoped atom as the closure it came from", () => {
    const { read, scope, name } = walkProgram();
    // `sink x_.inner_` walks as the word `sink` and the tight `x_.inner_`,
    // which is held with the closure's scope.
    const [, atom] = read("pass-inner").elements();
    expect(atom).toBeInstanceOf(FrameScoped);
    const body = new FrameLazy([atom]).bind(EvaluationScope.root(scope));
    const fp = potentialFootprint(body);
    const original = potentialFootprint(read("inner-of"));
    expect(names(fp.writes, name)).toEqual(["x.inner"]);
    expect(names(fp.writes, name)).toEqual(names(original.writes, name));
    expect(names(fp.reads, name)).toEqual(names(original.reads, name));
    expect(isOpaque(fp)).toBe(false);
  });

  it("walks an empty statement as touching nothing", () => {
    const { read, scope } = walkProgram();
    const statement = new FrameExpr([]);
    statement.is.statement = true;
    const body = new FrameLazy([statement]).bind(EvaluationScope.root(scope));
    const fp = potentialFootprint(body);
    const empty = potentialFootprint(read("empty"));
    expect(fp.reads.size).toBe(empty.reads.size);
    expect(fp.writes.size).toBe(0);
    expect(isOpaque(fp)).toBe(false);
  });

  it("writes nothing for an alias that lands on an import's read-only view", () => {
    const store = new MemoryStore();
    store.write("m.hc", ".C_ [.poke_ {@k 2}];");
    const scope = evaluate(".k 1; M <- './m.hc';", {
      [RESOURCE_ROOT_KEY]: FrameResource.root(store),
    });
    const target = readName(scope, "M").get("C_").get("poke_");
    const fp = potentialFootprint(target);
    const outcome = dispatch([{ label: "poke", target }], "sequential")
      .outcomes[0];
    expect(outcome.result.toString()).toEqual("$!.read-only-scope @k");
    expect(fp.writes.size).toBe(0);
    expect(isOpaque(fp)).toBe(false);
    expect(new Set(fp.reads)).toEqual(
      new Set(outcome.actual.sharedReads().filter(isState)),
    );
    expect(scope.get_here("k").toString()).toEqual("1");
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
