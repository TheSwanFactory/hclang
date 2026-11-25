import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameNumber,
  FrameScopeAnchor,
  FrameSymbol,
} from "../frames.ts";
import { HCEval } from "../execute/hc-eval.ts";
import { lastResult } from "../test-helpers.test.ts";

describe("FrameScopeAnchor", () => {
  const roots = (): {
    file: Frame;
    host: Frame;
    scope: EvaluationScope;
  } => {
    const file = new Frame();
    const host = new Frame();
    file.set("value", new FrameNumber("1"));
    host.set("value", new FrameNumber("2"));
    return { file, host, scope: EvaluationScope.root(file, host) };
  };

  it("binds printable references to the two named roots", () => {
    const { scope } = roots();
    const file = FrameScopeAnchor.file().in(scope);
    const host = FrameScopeAnchor.host().in(scope);

    expect(file.toString()).toEqual("$");
    expect(host.toString()).toEqual("$$");
    expect(file.call(FrameSymbol.for("value")).toString()).toEqual("1");
    expect(host.call(FrameSymbol.for("value")).toString()).toEqual("2");
  });

  it("grades namespace reads against the scope that bound the anchor", () => {
    const { file, host, scope } = roots();
    file.set("__secret", new FrameNumber("7"));
    file.set("_guarded", new FrameNumber("6"));
    host.set("__secret", new FrameNumber("8"));

    const fileAnchor = FrameScopeAnchor.file().in(scope);
    expect(fileAnchor.call(FrameSymbol.for("secret")).toString()).toEqual("7");
    expect(
      FrameScopeAnchor.host().in(scope).call(FrameSymbol.for("secret"))
        .toString(),
    ).toEqual("$!.is-private .secret");

    const outsider = new Frame();
    expect(fileAnchor.get("secret", outsider).toString()).toEqual(
      "$!.is-private .secret",
    );
    expect(fileAnchor.get("guarded", outsider).toString()).toEqual(
      "$!.is-protected .guarded",
    );
    const descendant = new Frame();
    descendant.setParent(file);
    expect(fileAnchor.get("secret", descendant).toString()).toEqual(
      "$!.is-private .secret",
    );
    expect(fileAnchor.get("guarded", descendant).toString()).toEqual("6");

    const nested = EvaluationScope.call(Frame.nil, Frame.nil, undefined, scope);
    expect(
      FrameScopeAnchor.file().in(nested).call(FrameSymbol.for("secret"))
        .toString(),
    ).toEqual("$!.is-private .secret");
    expect(
      FrameScopeAnchor.file().in(nested).call(FrameSymbol.for("guarded"))
        .toString(),
    ).toEqual("$!.is-protected .guarded");
  });

  it("turns an explicit namespace miss into a terminal error", () => {
    const { scope } = roots();
    const result = FrameScopeAnchor.host().in(scope).call(
      FrameSymbol.for("missing"),
    );

    expect(result.is.error).toBe(true);
    expect(result.toString()).toEqual("$!.name-missing $$.missing");
  });

  it("does not treat a namespace reference as a callable value", () => {
    const { scope } = roots();
    const result = FrameScopeAnchor.file().in(scope).call(
      new FrameNumber("3"),
    );

    expect(result.is.error).toBe(true);
    expect(result.toString()).toEqual("$!.scope-not-callable $");
  });
});
describe("FrameCatch", () => {
  it("evaluates to itself outside expression reduction", () => {
    // A walk holds `$!` as an atom; `{} [walk]` holds that aggregate as a
    // term, and calling it evaluates each atom on its own.
    const result = lastResult("({} [{1 $! 2} & {_}]) ()");
    expect(result.toString()).toEqual("[1, $!, 2]");
    const atom = result.at(1);
    expect(atom.className()).toEqual("FrameCatch");
    expect(atom.is.error).not.toBe(true);
  });
});
describe("a dollar form at the end of input", () => {
  // A source file whose last line has no newline reaches the end of input
  // with the dollar form still being scanned (`runfile` calls the last line
  // with `endOfLine` false), so `finish` completes it rather than a newline.
  const finish = (source: string): {
    complete: boolean;
    error: string | null;
    out: string;
  } => {
    const out = new FrameArray([]);
    const evaluator = new HCEval(out);
    evaluator.call(source, false);
    const complete = evaluator.finish();
    return { complete, error: evaluator.error(), out: out.toString() };
  };
  it("completes an anchor, an observation or the catch operator", () => {
    expect(finish("$")).toEqual({ complete: true, error: null, out: "[$]" });
    expect(finish("$$")).toEqual({ complete: true, error: null, out: "[$$]" });
    expect(finish("$#")).toEqual({
      complete: true,
      error: null,
      out: "[$!.observation-missing]",
    });
    expect(finish("$!")).toEqual({
      complete: true,
      error: null,
      out: "[$!.catch-operand-missing]",
    });
  });
  it("completes an error literal as the user error it raises", () => {
    expect(finish("$!.x")).toEqual({
      complete: true,
      error: null,
      out: "[$!!.x]",
    });
    expect(finish("$!!.y-1")).toEqual({
      complete: true,
      error: null,
      out: "[$!!.y-1]",
    });
  });
  it("rejects an unfinished form without a trailing newline in the message", () => {
    // The same forms ended by a newline report `$!!\n`.
    for (const source of ["$!!", "$!.", "$!!."]) {
      expect(finish(source)).toEqual({
        complete: false,
        error: `invalid dollar form: ${source}`,
        out: "[]",
      });
    }
    for (const source of ["$=", "$=abc", "$+ok", "$-no", "$~"]) {
      expect(finish(source)).toEqual({
        complete: false,
        error: `unterminated FrameNote: ${source}`,
        out: "[]",
      });
    }
  });
});
