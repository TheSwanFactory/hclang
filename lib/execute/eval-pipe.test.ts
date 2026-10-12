import { expect } from "jsr:@std/expect@^0.219.1";
import { beforeEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { EvalPipe } from "./eval-pipe.ts";
import * as frame from "../frames.ts";

describe("EvalPipe", () => {
  const strA = new frame.FrameString("A");
  const strB = new frame.FrameString("B");
  const expr = new frame.FrameExpr([strA, strB]);
  const value = new frame.FrameString("Value");
  const context = { key: value };
  let out: frame.FrameArray;
  let pipe: EvalPipe;

  beforeEach(() => {
    out = new frame.FrameArray([], context);
    pipe = new EvalPipe(out);
  });

  it("is exported", () => {
    expect(EvalPipe).toBeTruthy();
  });

  it("is constructed from an out parameter", () => {
    expect(pipe).toBeTruthy();
  });

  it("evaluates arguments", () => {
    const result = pipe.call(expr);
    expect(result.toString()).toEqual("“AB”");
  });

  it("evaluates symbols in context", () => {
    const symbol = new frame.FrameSymbol("key");
    const result = pipe.call(symbol);
    expect(result.toString()).toEqual(value.toString());
  });

  it("evaluates symbols in expressions", () => {
    const symbol = new frame.FrameSymbol("key");
    const wrap = new frame.FrameExpr([symbol]);
    const result = pipe.call(wrap);
    expect(result.toString()).toEqual(value.toString());
  });

  it("stores result in out", () => {
    expect(out.size()).toEqual(0);
    const result = pipe.call(expr);
    expect(out.size()).toEqual(1);
    expect(out.at(0)).toEqual(result);
  });

  it("reuses the exact supplied scope for every form", () => {
    class RecordingFrame extends frame.Frame {
      public readonly scopes: frame.EvaluationInput[] = [];

      public override in(input: frame.EvaluationInput = []): frame.Frame {
        this.scopes.push(input);
        return this;
      }
    }

    const fileScope = new frame.FrameArray([]);
    const scope = frame.EvaluationScope.root(fileScope);
    const recording = new RecordingFrame();
    const scoped = EvalPipe.scoped(out, scope);

    scoped.call(recording);
    scoped.call(recording);

    expect(recording.scopes).toEqual([scope, scope]);
  });

  it("makes declarations from prior scoped forms visible", () => {
    const fileScope = new frame.FrameArray([]);
    const scope = frame.EvaluationScope.root(fileScope);
    const scoped = EvalPipe.scoped(out, scope);
    const declaration = new frame.FrameExpr([
      new frame.FrameName("answer"),
      new frame.FrameInt("42"),
    ]);

    scoped.call(declaration);
    const result = scoped.call(
      new frame.FrameExpr([frame.FrameSymbol.for("answer")]),
    );

    expect(result.toString()).toEqual("42");
    expect(fileScope.get_here("answer").toString()).toEqual("42");
  });

  it("retains fresh root scopes for the legacy constructor", () => {
    class RecordingFrame extends frame.Frame {
      public readonly scopes: frame.EvaluationScope[] = [];

      public override in(input: frame.EvaluationInput = []): frame.Frame {
        this.scopes.push(frame.EvaluationScope.from(input));
        return this;
      }
    }

    const recording = new RecordingFrame();
    pipe.call(recording);
    pipe.call(recording);

    expect(recording.scopes).toHaveLength(2);
    expect(recording.scopes[0]).not.toBe(recording.scopes[1]);
    expect(recording.scopes[0].writeTarget).toBe(out);
    expect(recording.scopes[1].writeTarget).toBe(out);
  });
});
