import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  EvaluationScope,
  Frame,
  FrameNumber,
  FrameScopeAnchor,
  FrameSymbol,
} from "../frames.ts";

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
