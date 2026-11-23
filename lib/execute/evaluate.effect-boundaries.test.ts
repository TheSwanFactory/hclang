import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import { lastText as last } from "../test-helpers.test.ts";

describe("evaluate: effect boundaries and relactional semantics (006.17)", () => {
  // A managed value plus a shared `log_` the registered callback bumps, so a
  // committed mutation is observable as a count of callback invocations. The
  // callback never touches the managed value, so firing is the only effect.
  const withLog = (body: string): string =>
    last(
      ".log_ [.count 0; .tick_ {@count (count + 1);}];\n" + body +
        "\nlog_.count",
    );

  describe("arrow `A -> B` effect boundary (§3-4)", () => {
    it("invokes B anew when an unrelated actor C mutates A's value", () => {
      // C reaches the managed value through a *different* alias than the one
      // the arrow was written against, and its committed write fires B.
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          "owner_ -> {log_.tick_ ()};\n" +
          ".c_ owner_;\n" +
          "c_.set_ 9;",
      )).toContain("1");
    });

    it("fires once per committed mutation, through multiple aliases", () => {
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          "owner_ -> {log_.tick_ ()};\n" +
          ".a_ owner_; .b_ owner_;\n" +
          "owner_.set_ 2; a_.set_ 3; b_.set_ 4;",
      )).toContain("3");
    });

    it("does not fire on a refused, uncommitted mutation", () => {
      // A plain (non-mutating) method's `@value` write is refused, so nothing
      // commits and B is never invoked.
      expect(withLog(
        ".owner_ [.value 1; .write {@value 9}];\n" +
          "owner_ -> {log_.tick_ ()};\n" +
          "owner_.write ();",
      )).toContain("0");
    });

    it("does not fire when a functional update writes a copy", () => {
      // An immutable handle's mutating method updates a copy; the original A
      // the arrow observes never changes, so B stays silent — the stable
      // transactional observation of §5.
      expect(withLog(
        ".owner [.value 1; .write_ {@value _;}];\n" +
          "owner -> {log_.tick_ ()};\n" +
          ".updated_ (owner.write_ 9);",
      )).toContain("0");
    });

    it("registers idempotently for the same callback literal reused", () => {
      // Re-running the same arrow registration does not multiply invocations
      // of an already-registered callback identity.
      const shared = ".cb {log_.tick_ ()};\n";
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" + shared +
          "owner_ -> cb; owner_ -> cb;\n" +
          "owner_.set_ 2;",
      )).toContain("1");
    });

    it("answers the managed value unchanged so it composes left to right", () => {
      // `A -> B` is an effect boundary, not a transform: it yields A.
      expect(last(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          "owner_ -> {1}",
      )).toContain(".value 1");
    });
  });

  describe("invocation forms do not implicitly register (§3)", () => {
    it("executes an immediate call once with no continuing effect", () => {
      // Calling a closure runs its body once; a later mutation of an
      // unrelated value cannot retro-invoke it, because nothing registered.
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          "{log_.tick_ ()} ();\n" +
          "owner_.set_ 9;",
      )).toContain("1"); // the one immediate call, not a second from the write
    });

    it("delivers an ordinary return without registering a callback", () => {
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          ".make {log_.tick_ ()};\n" +
          ".r (make ());\n" +
          "owner_.set_ 9;",
      )).toContain("1"); // only the return's own call ran
    });
  });

  describe("relactional observation (§2.2, §2.3, §5)", () => {
    it("checked promotion preserves object identity, not a projection", () => {
      // `.name <schema> value` refines the exposed type and keeps the same
      // object; the projecting `<schema> value` is the explicit conversion.
      const promoted = evaluate(".rec [.a 1; .b 2]; .checked <.a, .b> rec;");
      expect(promoted.meta.checked).toBe(promoted.meta.rec);
      expect(evaluate("<.a, .b> [.a 1; .b 2]").at(0).toString()).toEqual(
        "[1, 2]",
      );
    });

    it("lets a readonly live handle observe an unrelated mutation", () => {
      // `ro` reads `owner_` without the effect marker: a live, non-writing
      // view. A later committed mutation is visible on a fresh read.
      expect(last(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          ".ro owner_;\n" +
          "owner_.set_ 5;\n" +
          "ro.value",
      )).toContain("5");
    });

    it("denies a readonly handle write authority over the live value", () => {
      // `ro` is a live view (same identity as `owner_`) but an immutable
      // name, so reaching a mutating method through it is a functional
      // update on a copy: the shared live value is never written through the
      // readonly handle. Observation without write authority (§2.2, §5).
      const r = evaluate(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          ".ro owner_;\n" +
          "ro.set_ 5",
      );
      expect(r.meta.ro).toBe(r.meta.owner_); // the handle is live, not a snapshot
      expect(r.meta.owner_.get_here("value").toString()).toEqual("1");
      // The write produced an updated copy, leaving the live value untouched.
      expect(r.asArray().at(-1)?.toString()).toContain(".value 5");
    });

    it("keeps a typed enumerable element valid after an aliased write", () => {
      // A declared element schema is re-checked on every committed write,
      // through any alias: a conforming write lands, an out-of-schema write
      // is refused and the element keeps its last valid, in-schema value.
      expect(last(
        ".box_ [.item <1, 2, 3> 1; .put_ {@item _;}];\n" +
          ".alias_ box_;\n" +
          "alias_.put_ 2;\n" +
          "box_.item",
      )).toContain("2");
      expect(last(
        ".box_ [.item <1, 2, 3> 1; .put_ {@item _;}];\n" +
          ".alias_ box_;\n" +
          "alias_.put_ 9;\n" +
          "box_.item",
      )).toContain("1");
    });

    it("switches interaction form without rewriting the computation", () => {
      // The same closure body `{log_.tick_ ()}` is used immediately, as a
      // return, and as an arrow callback, unchanged. Only the boundary
      // spelling differs; §11's convenience made concrete.
      const body = "{log_.tick_ ()}";
      expect(withLog(`${body} ();`)).toContain("1");
      expect(withLog(`.r (${body} ());`)).toContain("1");
      expect(withLog(
        ".owner_ [.value 1; .set_ {@value _;}];\n" +
          `owner_ -> ${body};\n` +
          "owner_.set_ 2;",
      )).toContain("1");
    });
  });
});
