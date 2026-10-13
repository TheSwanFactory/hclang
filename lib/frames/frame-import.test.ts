import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  type EvaluationInput,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameImport,
  FrameInt,
  FrameResource,
  FrameSchema,
  FrameString,
  MemoryStore,
} from "../frames.ts";

class CountingExpression extends Frame {
  public calls = 0;

  public constructor(private readonly answer: Frame) {
    super();
  }

  public override in(_input: EvaluationInput = []): Frame {
    this.calls += 1;
    return this.answer;
  }
}

const resource = (): FrameResource =>
  FrameResource.root(new MemoryStore()).extend("./module.hc") as FrameResource;

describe("FrameImport", () => {
  it("passes the exact current scope to a local import", () => {
    const file = new FrameArray([]);
    const scope = EvaluationScope.root(file);
    let importedScope: EvaluationScope | undefined;
    const answer = new FrameInt("7");

    const result = new FrameImport(
      { kind: "local" },
      resource(),
      (_resource, received) => {
        importedScope = received;
        return answer;
      },
    ).in(scope);

    expect(result).toBe(answer);
    expect(importedScope).toBe(scope);
  });

  it("commits the exact fresh child only after source success", () => {
    const file = new FrameArray([]);
    const prior = new FrameString("prior");
    file.set("module", prior);
    const scope = EvaluationScope.root(file);
    let child: EvaluationScope | undefined;
    const answer = new FrameInt("7");

    const result = new FrameImport(
      { kind: "named", key: "module" },
      resource(),
      (_resource, received) => {
        child = received;
        expect(file.get_here("module")).toBe(prior);
        expect(received.argument).toBe(received.writeTarget);
        return answer;
      },
    ).in(scope);

    expect(result).toBe(answer);
    expect(file.get_here("module")).toBe(child?.writeTarget);
    expect(child?.argument).toBe(file.get_here("module"));
    expect(child?.enclosing).toBe(scope);
  });

  it("preserves the prior target on right-side failure", () => {
    const file = new FrameArray([]);
    const prior = new FrameString("prior");
    const failure = Frame.error("$!.right-side-failure");
    const expression = new CountingExpression(failure);
    file.set("module", prior);
    let sourceCalls = 0;

    const result = new FrameImport(
      { kind: "named", key: "module" },
      expression,
      () => {
        sourceCalls += 1;
        return Frame.nil;
      },
    ).in(EvaluationScope.root(file));

    expect(result).toBe(failure);
    expect(expression.calls).toEqual(1);
    expect(sourceCalls).toEqual(0);
    expect(file.get_here("module")).toBe(prior);
  });

  it("preserves the prior target for a non-resource right side", () => {
    const file = new FrameArray([]);
    const prior = new FrameString("prior");
    const expression = new CountingExpression(new FrameInt("7"));
    file.set("module", prior);
    let sourceCalls = 0;

    const result = new FrameImport(
      { kind: "named", key: "module" },
      expression,
      () => {
        sourceCalls += 1;
        return Frame.nil;
      },
    ).in(EvaluationScope.root(file));

    expect(result.toString()).toEqual("$!.resource-import-source-type 7");
    expect(expression.calls).toEqual(1);
    expect(sourceCalls).toEqual(0);
    expect(file.get_here("module")).toBe(prior);
  });

  it("does not expose a partially evaluated child after source failure", () => {
    const file = new FrameArray([]);
    const prior = new FrameString("prior");
    const failure = Frame.error("$!.source-failure");
    file.set("module", prior);
    let child: EvaluationScope | undefined;

    const result = new FrameImport(
      { kind: "named", key: "module" },
      resource(),
      (_resource, received) => {
        child = received;
        received.writeTarget.set("partial", new FrameInt("1"));
        expect(file.get_here("module")).toBe(prior);
        return failure;
      },
    ).in(EvaluationScope.root(file));

    expect(result).toBe(failure);
    expect(file.get_here("module")).toBe(prior);
    expect(file.get_here("partial").is.missing).toBe(true);
    expect(child?.writeTarget.get_here("partial").toString()).toEqual("1");
  });

  it("returns a post-success constant refusal without replacing the target", () => {
    const file = new FrameArray([]);
    const prior = new FrameInt("1");
    const expression = new CountingExpression(resource());
    file.set("Module", prior);
    let sourceCalls = 0;

    const result = new FrameImport(
      { kind: "named", key: "Module" },
      expression,
      () => {
        sourceCalls += 1;
        return new FrameInt("7");
      },
    ).in(EvaluationScope.root(file));

    expect(result.toString()).toEqual("$error{$is-constant .Module}");
    expect(expression.calls).toEqual(1);
    expect(sourceCalls).toEqual(1);
    expect(file.get_here("Module")).toBe(prior);
  });

  it("returns a post-success schema refusal without creating the target", () => {
    const file = new FrameArray([]);
    file.set("module.<>", new FrameSchema([new FrameInt("1")]));
    let sourceCalls = 0;

    const result = new FrameImport(
      { kind: "named", key: "module" },
      resource(),
      () => {
        sourceCalls += 1;
        return new FrameInt("7");
      },
    ).in(EvaluationScope.root(file));

    expect(result.toString()).toContain("$!.type-error .module <1>");
    expect(sourceCalls).toEqual(1);
    expect(file.get_here("module").is.missing).toBe(true);
  });
});
