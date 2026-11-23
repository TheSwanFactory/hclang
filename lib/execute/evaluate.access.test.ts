import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import { firstEntryLastText as answer } from "../test-helpers.test.ts";

describe("evaluate: access and effects", () => {
  it("enforces visibility through ordinary property syntax", () => {
    const declaration =
      ".owner [.public 42; ._protected 21; .__private 7; .child {[public, protected, private]}];";

    expect(evaluate(`${declaration} owner.public`).at(0).toString())
      .toMatch(/; 42\)$/);
    expect(evaluate(`${declaration} owner.protected`).at(0).toString())
      .toContain("$!.is-protected .protected");
    expect(evaluate(`${declaration} owner.private`).at(0).toString())
      .toContain("$!.is-private .private");
    // A method runs against its receiver, so the owner reaches every one of
    // its own declarations, private included.
    expect(evaluate(`${declaration} owner.child()`).at(0).toString())
      .toContain("[42, 21, 7]");
  });

  it("does not absorb body declarations into a method's receiver", () => {
    // A constructed aggregate is a value, not an open declaration target, so
    // a non-mutating method cannot quietly add fields to its receiver.
    const immutable = evaluate(".obj [.m {.zz 1}]; obj.m(); obj.zz");
    const mutable = evaluate(".obj_ [.m {.yy 2}]; obj_.m(); obj_.yy");

    expect(immutable.at(-1).toString()).toContain("$!.name-missing");
    expect(immutable.meta.obj.get_here("zz").is.missing).toBe(true);
    expect(mutable.at(-1).toString()).toContain("$!.name-missing");
    expect(mutable.meta.obj_.get_here("yy").is.missing).toBe(true);
  });

  it("refuses receiver aliases from plain methods through immutable handles", () => {
    const result = evaluate(
      ".owner [.value 1; .write {@value 9}]; owner.write()",
    );

    expect(result.at(0).toString()).toContain(
      "$!.method-not-mutating @value",
    );
    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
  });

  it("refuses receiver aliases from plain methods through mutable handles", () => {
    const result = evaluate(
      ".owner_ [.value 1; .write {@value 9}]; owner_.write()",
    );

    expect(result.at(0).toString()).toContain(
      "$!.method-not-mutating @value",
    );
    expect(result.meta.owner_.get_here("value").toString()).toEqual("1");
  });

  it("updates a copy through mutating receiver aliases on immutable handles", () => {
    const result = evaluate(
      ".owner [.value 1; .write_ {@value _;}]; " +
        ".updated_ (owner.write_ 9)",
    );

    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
    expect(result.meta.updated_.get_here("value").toString()).toEqual("9");
    expect(result.meta.updated_).not.toBe(result.meta.owner);
  });

  it("updates in place through mutating receiver aliases on mutable handles", () => {
    const result = evaluate(
      ".owner_ [.value 1; .write_ {@value _;}]; owner_.write_ 9",
    );

    expect(result.at(0).toString()).toContain(".value 9;");
    expect(result.meta.owner_.get_here("value").toString()).toEqual("9");
  });

  it("gates the receiver before a shadowed lexical alias target", () => {
    const result = evaluate(
      ".value 100; .owner [.value 1; .write {@value 9}]; " +
        "owner.write(); value; owner.value",
    );

    expect(result.at(0).toString()).toContain(
      "$!.method-not-mutating @value",
    );
    expect(result.meta.value.toString()).toEqual("100");
    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
  });

  it("keeps lexical alias fallback away from the caller argument", () => {
    const result = evaluate(
      ".x 1; .owner [.write {@x 9}]; .arg (.x 5); " +
        "owner.write(arg); [x, arg.x]",
    );

    expect(result.at(-1).toString()).toContain("[9, 5]");
    expect(result.meta.x.toString()).toEqual("9");
    expect(result.meta.arg.get_here("x").toString()).toEqual("5");
  });

  it("does not use an argument-only binding as an alias target", () => {
    const result = evaluate(
      ".owner [.write {@x 9}]; .arg (.x 5); owner.write(arg)",
    );

    expect(result.at(-1).toString()).toContain("$!.name-missing");
    expect(result.meta.arg.get_here("x").toString()).toEqual("5");
  });

  it("writes an inherited method's alias miss where the method was written", () => {
    // `write_` is written where `x` is 1, and its receiver is read through
    // `inner`, which binds its own `x`. The read path supplies no name (#400).
    const result = evaluate(
      ".x 1; .parent [.write_ {@x _;}]; " +
        ".inner [.x 5; .child_ [.^ parent]]; " +
        "inner.child_.write_ 9; [x, inner.x]",
    );

    expect(result.at(0).asArray().at(-1)?.toString()).toEqual("[9, 5]");
  });

  it("preserves receiver authority through conditional blocks", () => {
    const result = evaluate(
      ".old [.marker 1]; .next [.marker 2]; " +
        ".child_ [.^ old; .reparent_ {1 ? {.^ next}}]; " +
        "child_.reparent_ 0; child_.marker",
    );

    expect(result.at(-1).toString()).toMatch(/; 2\)$/);
    expect(result.meta.child_.parent).toBe(result.meta.next);
  });

  it("preserves functional receiver updates through iterator blocks", () => {
    const result = evaluate(
      ".owner [.value 1; .write_ {[1] & {@value 9}}]; " +
        ".updated_ (owner.write_ 0); [owner.value, updated_.value]",
    );

    expect(result.at(-1).toString()).toContain("[1, 9]");
    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
    expect(result.meta.updated_.get_here("value").toString()).toEqual("9");
  });

  it("does not grant callback writes to a non-mutating method", () => {
    const result = evaluate(
      ".owner_ [.value 1; .write {1 ? {@value 9}}]; owner_.write()",
    );

    expect(result.at(-1).toString()).toContain(
      "$!.method-not-mutating @value",
    );
    expect(result.meta.owner_.get_here("value").toString()).toEqual("1");
  });

  it("binds a bare sibling mutator as a functional receiver update", () => {
    const result = evaluate(
      ".owner [.value 1; .write_ {@value _;}; .sneak {write_ 9}]; " +
        ".updated_ (owner.sneak()); [owner.value, updated_.value]",
    );

    expect(result.at(-1).toString()).toContain("[1, 9]");
    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
    expect(result.meta.updated_.get_here("value").toString()).toEqual("9");
  });

  it("does not propagate receiver authority into ordinary helper calls", () => {
    const result = evaluate(
      ".next []; .helper {.^ next}; " +
        ".owner_ [.invoke_ {helper()}]; owner_.invoke_ 0",
    );

    expect(result.at(-1).toString()).toContain(
      "$!.parent-not-declarable .^",
    );
    expect(result.meta.owner_.hasDeclaredParent()).toBe(false);
  });

  it("does not grant receiver authority to a named conditional helper", () => {
    const result = evaluate(
      ".next [.marker 2]; .helper {.^ next}; " +
        ".owner_ [.invoke_ {1 ? helper}]; owner_.invoke_ 0",
    );

    expect(result.at(-1).toString()).toContain(
      "$!.parent-not-declarable .^",
    );
    expect(result.meta.owner_.hasDeclaredParent()).toBe(false);
  });

  it("does not grant receiver authority to a named iterator helper", () => {
    const result = evaluate(
      ".next []; .helper {.^ next}; " +
        ".owner_ [.invoke {[1] | helper}]; owner_.invoke()",
    );

    expect(result.at(-1).toString()).toContain(
      "$!.parent-not-declarable .^",
    );
    expect(result.meta.owner_.hasDeclaredParent()).toBe(false);
  });

  it("preserves receiver authority through nested inline callbacks", () => {
    const result = evaluate(
      ".owner [.value 1; .write_ {1 ? {[1] & {@value 9}}}]; " +
        ".updated_ (owner.write_ 0); [owner.value, updated_.value]",
    );

    expect(result.at(-1).toString()).toContain("[1, 9]");
    expect(result.meta.owner.get_here("value").toString()).toEqual("1");
    expect(result.meta.updated_.get_here("value").toString()).toEqual("9");
  });

  it("keeps callback state fresh across repeated functional calls", () => {
    const result = evaluate(
      ".owner [.value 1; .write_ {1 ? {@value 9}}]; " +
        ".first_ (owner.write_ 0); .second_ (owner.write_ 0); " +
        "[owner.value, first_.value, second_.value]",
    );

    expect(result.at(-1).toString()).toContain("[1, 9, 9]");
    expect(result.meta.first_).not.toBe(result.meta.owner);
    expect(result.meta.second_).not.toBe(result.meta.owner);
    expect(result.meta.second_).not.toBe(result.meta.first_);
  });

  it("restores outer callback state after a nested receiver call", () => {
    const result = evaluate(
      ".inner_ [.value 2; .write_ {1 ? {@value 8}}]; " +
        ".outer_ [.value 1; " +
        ".write_ {inner_.write_ 0; 1 ? {@value 9}}]; " +
        "outer_.write_ 0; [outer_.value, inner_.value]",
    );

    expect(result.at(-1).toString()).toContain("[9, 8]");
    expect(result.meta.outer_.get_here("value").toString()).toEqual("9");
    expect(result.meta.inner_.get_here("value").toString()).toEqual("8");
  });

  it("refuses protected access to a merely nested aggregate", () => {
    // Lexical nesting is not inheritance: a child aggregate is a peer for
    // visibility, not a descendant, because it declares no parent.
    const result = evaluate(
      ".owner [._p 21; .__q 7; .child [.read {[p,q]}]]; " +
        "owner.child.read()",
    );

    expect(result.at(0).toString()).toContain(
      "[$!.is-protected .p, $!.is-private .q]",
    );
  });

  it("refuses protected access to an unrelated peer's method", () => {
    // The access path must not change the answer: a peer method is refused
    // exactly as a peer's dotted access at top level is.
    const result = evaluate(
      ".vault [._secret 99]; .thief [.steal {vault.secret}]; thief.steal()",
    );

    expect(result.at(0).toString()).toContain("$!.is-protected .secret");
    expect(evaluate(".vault [._secret 99]; vault.secret").at(0).toString())
      .toContain("$!.is-protected .secret");
  });

  it("writes protected declarations without creating public shadows", () => {
    const result = evaluate(
      ".owner_ [._protected 7; .attempt_ {@protected _;}]; " +
        "owner_.attempt_ 9",
    );
    const owner = result.meta.owner_;

    expect(owner.get_here("_protected").toString()).toEqual("9");
    expect(owner.meta.protected).toBeUndefined();
  });

  it("writes inherited protected declarations without creating shadows", () => {
    const result = evaluate(
      ".base_ [._count 41]; " +
        ".derived_ [.^ base_; .read {count}; .set-count_ {@count _;}]; " +
        "derived_.set-count_ 99; derived_.read()",
    );
    const base = result.meta.base_;
    const derived = result.meta.derived_;

    expect(result.at(0).toString()).toMatch(/; 99\)$/);
    expect(base.get_here("_count").toString()).toEqual("99");
    expect(derived.get_here("_count").is.missing).toBe(true);
    expect(derived.meta.count).toBeUndefined();
  });

  describe("copy on write (#401)", () => {
    it("shares what a functional update never writes", () => {
      expect(answer(
        ".kid [.n 1]; .k [.fig kid; .touch_ {@fig fig;}]; " +
          ".c (k.touch_ ()); [c.fig === kid, c === k]",
      )).toEqual("[<>, ()]");
      expect(answer(
        ".p [.v 1; .w [.n 2]; .set_ {@v _;}]; .q (p.set_ 9); " +
          "[q.v, p.v, q.w === p.w]",
      )).toEqual("[9, 1, <>]");
    });

    it("copies the path down to a nested write and nothing beside it", () => {
      expect(answer(
        ".a [.b_ [.c_ [.n 1; .set_ {@n _;}]; .side [.m 0]]; " +
          ".go_ {b_.c_.set_ _}]; .r (a.go_ 7); " +
          "[r.b_.c_.n, a.b_.c_.n, r.b_ === a.b_, r.b_.side === a.b_.side]",
      )).toEqual("[7, 1, (), <>]");
    });

    it("lands repeated writes in one call on the same copy", () => {
      expect(answer(
        ".t [.x_ [.n 0; .inc_ {@n (n + 1);}]; .go_ {x_.inc_ (); x_.inc_ ()}]; " +
          "[(t.go_ ()).x_.n, t.x_.n]",
      )).toEqual("[2, 0]");
    });
  });

  it("rejects inherited writes through a copy-on-write receiver", () => {
    const result = evaluate(
      ".base_ [._count 41]; " +
        ".derived [.^ base_; .set-count_ {@count _;}]; " +
        "derived.set-count_ 99",
    );
    const base = result.meta.base_;
    const derived = result.meta.derived;

    expect(result.at(0).toString()).toContain(
      "$!.copy-on-write-boundary .count",
    );
    expect(base.get_here("_count").toString()).toEqual("41");
    expect(derived.get_here("_count").is.missing).toBe(true);
    expect(derived.meta.count).toBeUndefined();
  });

  it("rejects nested inherited writes across a copy-on-write boundary", () => {
    const result = evaluate(
      ".base_ [._count 41]; " +
        ".derived [.^ base_; " +
        ".inner_ [.^ base_; .set-count_ {@count _;}]; " +
        ".bump_ {inner_.set-count_ _}]; " +
        "derived.bump_ 99",
    );

    expect(result.at(0).toString()).toContain(
      "$!.copy-on-write-boundary .count",
    );
    expect(result.meta.base_.get_here("_count").toString()).toEqual("41");
  });

  it("preserves copy boundaries across repeated aggregate lookup", () => {
    const result = evaluate(
      ".base_ [._count 1]; " +
        ".derived [.inner_ [.leaf_ [.^ base_; " +
        ".set-count_ {@count _;}]]; " +
        ".bump_ {inner_.leaf_.set-count_ _}]; " +
        "derived.bump_ 9",
    );

    expect(result.at(0).toString()).toContain(
      "$!.copy-on-write-boundary .count",
    );
    expect(result.meta.base_.get_here("_count").toString()).toEqual("1");
  });

  it("rejects writes to aggregates inherited by a copied receiver", () => {
    const result = evaluate(
      ".base_ [.inner_ [.own 1; .set-own_ {@own _;}]]; " +
        ".derived [.^ base_; .bump_ {inner_.set-own_ _}]; " +
        "derived.bump_ 99",
    );
    const inner = result.meta.base_.get_here("inner_");

    expect(result.at(0).toString()).toContain(
      "$!.copy-on-write-boundary .set-own",
    );
    expect(inner.get_here("own").toString()).toEqual("1");
  });

  it("rejects re-parenting shared state inherited by a copied receiver", () => {
    const result = evaluate(
      ".next [.marker 9]; " +
        ".base [.inner_ [.value 1; .reparent_ {.^ _;}]]; " +
        ".owner [.^ base; .change_ {inner_.reparent_ next}]; " +
        "owner.change_ 0",
    );
    const sharedInner = result.meta.base.get_here("inner_");

    expect(result.at(-1).toString()).toContain(
      "$!.copy-on-write-boundary .reparent",
    );
    expect(sharedInner.hasDeclaredParent()).toBe(false);
    expect(sharedInner.get_here("value").toString()).toEqual("1");
  });

  it("allows the same nested writes through mutable receivers", () => {
    const result = evaluate(
      ".countbase_ [._count 1]; " +
        ".deep_ [.inner_ [.leaf_ [.^ countbase_; " +
        ".set-count_ {@count _;}]]; " +
        ".bump_ {inner_.leaf_.set-count_ _}]; " +
        ".ownerbase_ [.inner_ [.own 1; .set-own_ {@own _;}]]; " +
        ".inheritor_ [.^ ownerbase_; .bump_ {inner_.set-own_ _}]; " +
        "deep_.bump_ 9; inheritor_.bump_ 99",
    );
    const inheritedInner = result.meta.ownerbase_.get_here("inner_");

    expect(result.at(0).toString()).not.toContain(
      "$!.copy-on-write-boundary",
    );
    expect(result.meta.countbase_.get_here("_count").toString()).toEqual(
      "9",
    );
    expect(inheritedInner.get_here("own").toString()).toEqual("99");
  });

  it("does not retain copy-on-write restrictions on returned values", () => {
    const result = evaluate(
      ".base_ [._count 41]; " +
        ".derived [.^ base_; .own 1; " +
        ".set-own_ {@own _;}; .set-count_ {@count _;}]; " +
        ".copy_ (derived.set-own_ 2); copy_.set-count_ 99",
    );
    const base = result.meta.base_;
    const derived = result.meta.derived;
    const copy = result.meta.copy_;

    expect(result.at(0).toString()).not.toContain(
      "$!.copy-on-write-boundary",
    );
    expect(base.get_here("_count").toString()).toEqual("99");
    expect(derived.get_here("own").toString()).toEqual("1");
    expect(copy.get_here("own").toString()).toEqual("2");
  });

  it("reassigns logical protected and private names in place", () => {
    const result = evaluate(
      ".owner [._protected 7; .protected 9; " +
        ".__private 3; .private 5]",
    );
    const owner = result.meta.owner;

    expect(owner.get_here("_protected").toString()).toEqual("9");
    expect(owner.get_here("__private").toString()).toEqual("5");
    expect(owner.meta.protected).toBeUndefined();
    expect(owner.meta.private).toBeUndefined();
  });

  it("enforces constants through their logical visibility name", () => {
    const result = evaluate(
      ".owner [._Protected 7; .Protected 9; " +
        ".__Private 3; .Private 5]",
    );
    const owner = result.meta.owner;

    expect(result.asArray()[0].toString()).toContain(
      "$error{$is-constant .Protected}",
    );
    expect(result.asArray()[0].toString()).toContain(
      "$error{$is-constant .Private}",
    );
    expect(owner.get_here("_Protected").toString()).toEqual("7");
    expect(owner.get_here("__Private").toString()).toEqual("3");
    expect(owner.meta.Protected).toBeUndefined();
    expect(owner.meta.Private).toBeUndefined();
  });

  it("writes an own private declaration from an own mutating method", () => {
    // The receiver is the owner, so the write is authorized, lands on the
    // private declaration, and still creates no public shadow.
    const result = evaluate(
      ".owner_ [.__private 7; .attempt_ {@private _;}]; " +
        "owner_.attempt_ 9",
    );
    const owner = result.meta.owner_;

    expect(owner.get_here("__private").toString()).toEqual("9");
    expect(owner.meta.private).toBeUndefined();
    // Outside that receiver the same name stays refused.
    expect(
      evaluate(".owner [.__private 7]; owner.private").at(0).toString(),
    ).toContain("$!.is-private .private");
  });

  it("compares handles symmetrically through their targets", () => {
    expect(evaluate(".x [.a 1]; .y [.a 2]; x == y").at(0).toString())
      .toContain("; ())");
    expect(evaluate(".x [.a 1]; [.a 2] == x").at(0).toString())
      .toContain("; ())");
    expect(evaluate(".x [.a 1]; [.a 1] == x").at(0).toString())
      .toContain("; <>)");
    expect(evaluate(".x [.a 1]; x == [.a 1]").at(0).toString())
      .toContain("; <>)");
  });

  it("answers identity through handles with ===", () => {
    expect(evaluate(".x [.a 1]; x === x").at(0).toString())
      .toContain("; <>)");
    expect(evaluate(".x [.a 1]; .y x; y === x").at(0).toString())
      .toContain("; <>)");
    expect(evaluate(".x [.a 1]; [.a 1] === x").at(0).toString())
      .toContain("; ())");
  });

  it("copies immutable receivers before mutating methods", () => {
    const result = evaluate(
      ".fixed [.property 42; .accessor {property}; .mutator_ {@property _;}]; " +
        ".varying_ (fixed.mutator_ 113); varying_.accessor(); fixed.accessor()",
    );

    expect(result.at(0).toString()).toContain("(113); 42)");
    expect(result.meta.fixed.get_here("property").toString()).toEqual("42");
  });

  it("synchronizes mutable aliases through shared identity", () => {
    const result = evaluate(
      ".shared_ [.property 42; .mutator_ {@property _;}]; " +
        ".alias_ shared_; alias_.mutator_ 113; " +
        "shared_.property; alias_.property",
    );

    expect(result.at(0).toString()).toContain("(113); 113)");
    expect(result.meta.shared_.get_here("property").toString()).toEqual(
      "113",
    );
  });

  it("keeps constancy independent from mutable-handle effects", () => {
    const result = evaluate(
      ".Thing_ [.property 42; .mutator_ {@property _;}]; " +
        "Thing_.mutator_ 113; .Thing_ 7",
    );

    expect(result.at(0).toString()).toContain(
      "$error{$is-constant .Thing_}",
    );
    expect(result.meta.Thing_.get_here("property").toString()).toEqual(
      "113",
    );
  });

  it("returns the receiver rather than a mutator body's value", () => {
    const result = evaluate(
      ".mutable_ [.property 42; .mutator_ {@property _; 999}]; " +
        "mutable_.mutator_ 113",
    );

    expect(result.at(0).toString()).toContain(".property 113;");
    expect(result.at(0).toString()).not.toMatch(/; 999\)$/);
  });

  it("constructs singleton frames from existing interpretations", () => {
    const result = evaluate(
      ".object_ [._property 13; .get {_property}; " +
        ".set_ {@property _;}]; object_.get(); " +
        "object_.set_ 42; object_.get()",
    );

    expect(result.at(0).toString()).toContain("(13)");
    expect(result.at(0).toString()).toMatch(/; 42\)$/);
  });

  it("constructs class instances by calling a frame-producing closure", () => {
    const result = evaluate(
      ".class {[._property _; .get {_property}]}; " +
        ".instance (class 3); instance.get()",
    );

    expect(result.at(0).toString()).toMatch(/; 3\)$/);
    expect(result.meta.instance.get_here("_property").toString()).toEqual(
      "3",
    );
  });

  it("reads each instance's own fields through a shared method body", () => {
    // Instances share one body, whose captured scope is whichever instance
    // was built last, so the receiver must be consulted ahead of it. Calling
    // back into an earlier instance must not read the later one's fields.
    const shared = evaluate(
      ".Klass {[.own _; .read {own}]}; " +
        ".one (Klass 1); .two (Klass 2); [one.read(), two.read(), one.read()]",
    );

    expect(shared.at(-1).toString()).toContain("[1, 2, 1]");
  });

  it("resolves a shared method's free names where it was written", () => {
    // `left` and `right` each bind `lexical` and hold the same `shared`, but
    // `read` was written where `lexical` is “root”, and that is what it reads
    // however it is reached (#400, overriding #347's read-path lookup).
    const result = evaluate(
      ".lexical “root”; " +
        ".shared [.inner [.read {lexical}]; .get {inner}]; " +
        ".left [.lexical “left”; .shared shared]; " +
        ".right [.lexical “right”; .shared shared]; " +
        "[left.shared.get().read(), right.shared.get().read()]",
    );

    expect(result.toString()).toContain("[“root”, “root”]");
  });

  it("never lets the scope holding a receiver bind its method's names", () => {
    const result = evaluate(
      ".f 9; .O {[.m {f}]}; .s {.f 5; .o (O()); o.m()}; s()",
    );

    expect(result.at(0).asArray().at(-1)?.toString()).toEqual("9");
  });

  it("never acquires a missing member from the scope holding the aggregate", () => {
    expect(evaluate(".k 1; .o [.v 2]; o.k").at(0).toString()).toContain(
      "$!.name-missing",
    );
  });

  it("reads each instance's own private fields through a shared body", () => {
    const shared = evaluate(
      ".Klass {[.__own _; .read {own}]}; " +
        ".one (Klass 1); .two (Klass 2); [one.read(), two.read(), one.read()]",
    );

    expect(shared.at(-1).toString()).toContain("[1, 2, 1]");
  });

  it("constructs repeated instances without mutating the class aggregate", () => {
    const result = evaluate(
      ".Class {[.Value _; .get {Value}]}; " +
        ".first (Class 1); .second (Class 2); " +
        "first.get(); second.get()",
    );

    expect(result.at(0).toString()).toMatch(/; \(1\); 2\)$/);
    expect(result.meta.first.get_here("Value").toString()).toEqual("1");
    expect(result.meta.second.get_here("Value").toString()).toEqual("2");
    expect(result.meta.Class.meta.Value).toBeUndefined();
  });

  it("propagates direct and aggregate errors out of mutating methods", () => {
    const constant = evaluate(
      ".owner_ [.Value 1; .change_ {@Value _;}]; owner_.change_ 2",
    );
    const schema = evaluate(
      ".owner_ [.value <1> 1; .change_ {@value _;}]; owner_.change_ 2",
    );
    const aggregate = evaluate(
      ".owner_ [.value <1> 1; .change_ {[1] & {@value 2}}]; " +
        "owner_.change_ 2",
    );
    const trailingStatement = evaluate(
      ".owner_ [.value <1> 1; .change_ {[1] & {@value 2};}]; " +
        "owner_.change_ 2",
    );
    const sequenced = evaluate(
      ".owner_ [.value <1,3> 1; " +
        ".change_ {[1] & {@value 2}; @value 3}]; owner_.change_ 0",
    );

    expect(constant.at(0).toString()).toContain(
      "$error{$is-constant .Value}",
    );
    expect(constant.meta.owner_.get_here("Value").toString()).toEqual("1");
    expect(schema.at(0).toString()).toContain(
      "$!.type-error .value <1> 2",
    );
    expect(schema.meta.owner_.get_here("value").toString()).toEqual("1");
    expect(aggregate.at(0).toString()).toContain(
      "$!.type-error .value <1> 2",
    );
    expect(aggregate.meta.owner_.get_here("value").toString()).toEqual("1");
    expect(trailingStatement.at(0).toString()).toContain(
      "$!.type-error .value <1> 2",
    );
    expect(trailingStatement.meta.owner_.get_here("value").toString())
      .toEqual("1");
    expect(sequenced.at(0).toString()).toContain(
      "$!.type-error .value <1, 3> 2",
    );
    expect(sequenced.meta.owner_.get_here("value").toString()).toEqual("1");
  });

  it("covers #334's aggregate-error reproducer", () => {
    const result = evaluate(
      ".b_ [.n <1,2,3> 2; .run_ {[1] & {@n 4}}]; [b_.run_ 0]",
    );

    expect(result.at(0).toString()).toContain(
      "$!.type-error .n <1, 2, 3> 4",
    );
    expect(result.meta.b_.get_here("n").toString()).toEqual("2");
  });

  it("keeps nested error-valued aggregates as sequence data", () => {
    const result = evaluate(
      ".owner_ [.value <1,3> 1; " +
        ".change_ {[[1] & {@value 2}]; @value 3}]; owner_.change_ 0",
    );

    // The first result is [[type-error]], so the shallow rule continues to
    // the later statement instead of promoting nested error-valued data.
    expect(result.meta.owner_.get_here("value").toString()).toEqual("3");
  });

  it("updates an immutable receiver functionally, at any depth", () => {
    const result = evaluate(
      ".pair [.inner_ [.n 1; .set-n_ {@n _;}]; .bump_ {inner_.set-n_ _}]; " +
        "(pair.bump_ 5).inner_.n; pair.inner_.n",
    );

    // Copy-on-write is the only instance-copy caller: the call evaluates to
    // the new value and the original is untouched through its nested
    // aggregate, which a plumbing copy would have shared.
    expect(result.at(0).toString()).toMatch(/; \(5\); 1\)$/);
    expect(
      result.meta.pair.get_here("inner_").get_here("n").toString(),
    ).toEqual("1");
  });

  it("mutates a mutable receiver in place, sharing nested identity", () => {
    const result = evaluate(
      ".live_ [.inner_ [.n 1; .set-n_ {@n _;}]; .bump_ {inner_.set-n_ _}]; " +
        "live_.bump_ 9; live_.inner_.n",
    );

    expect(result.at(0).toString()).toMatch(/; 9\)$/);
    expect(
      result.meta.live_.get_here("inner_").get_here("n").toString(),
    ).toEqual("9");
  });

  it("interprets a parent declaration as the declared parent link", () => {
    const result = evaluate(
      ".base [.public 42; ._protected 21; .__private 7]; " +
        ".subclass {[.^ base; " +
        ".values {[public, protected, private]}]}; " +
        ".instance (subclass()); instance.values()",
    );
    const instance = result.meta.instance;

    // The declared parent has its own field, so it is not confused with the
    // lexical scope the instance happens to have been evaluated in.
    expect(instance.parent).toBe(result.meta.base);
    expect(instance.hasDeclaredParent()).toBe(true);
    expect(result.at(0).toString()).toContain(
      "[42, 21, $!.is-private .private]",
    );
  });

  it("refuses a parent write outside construction and method calls", () => {
    const result = evaluate(".base []; .^ base");

    expect(result.at(-1).toString()).toContain(
      "$!.parent-not-declarable .^",
    );
  });

  it("re-parents a mutable receiver in place", () => {
    const result = evaluate(
      ".oldBase [.marker 1]; .newBase [.marker 2]; " +
        ".child_ [.^ oldBase; .reparent_ {.^ _;}]; " +
        "child_.reparent_ newBase; child_.marker",
    );
    const child = result.meta.child_;

    expect(child.parent).toBe(result.meta.newBase);
    expect(result.at(-1).toString()).toMatch(/; 2\)$/);
  });

  it("re-parents only the functional copy of an immutable receiver", () => {
    const result = evaluate(
      ".oldBase [.marker 1]; .newBase [.marker 2]; " +
        ".child [.^ oldBase; .reparent_ {.^ _;}]; " +
        ".updated_ (child.reparent_ newBase); " +
        "[child.marker, updated_.marker]",
    );
    const child = result.meta.child;
    const updated = result.meta.updated_;

    expect(child.parent).toBe(result.meta.oldBase);
    expect(updated).not.toBe(child);
    expect(updated.parent).toBe(result.meta.newBase);
    expect(result.at(-1).toString()).toContain("[1, 2]");
  });

  it("refuses receiver re-parenting from a non-mutating method", () => {
    const result = evaluate(
      ".oldBase []; .newBase []; " +
        ".child_ [.^ oldBase; .reparent {.^ _;}]; " +
        "child_.reparent(newBase)",
    );
    const child = result.meta.child_;

    expect(result.at(-1).toString()).toContain(
      "$!.method-not-mutating .^",
    );
    expect(child.parent).toBe(result.meta.oldBase);
  });

  it("rejects an indirect parent cycle reached through a mutating method", () => {
    const result = evaluate(
      ".left_ [.reparent_ {.^ _;}]; .right_ [.^ left_]; " +
        "left_.reparent_ right_",
    );
    const left = result.meta.left_;
    const right = result.meta.right_;

    expect(result.at(-1).toString()).toContain("$!.cyclic-parent .^");
    expect(left.hasDeclaredParent()).toBe(false);
    expect(right.parent).toBe(left);
  });

  it("supports user-defined multiple-base composition", () => {
    const result = evaluate(
      ".compose { [.a _.0.a; .b _.1.b] }; " +
        ".left [.a 1]; .right [.b 2]; " +
        ".combined (compose [left, right]); combined.a; combined.b",
    );

    expect(result.at(0).toString()).toMatch(/; \(1\); 2\)$/);
  });
});
