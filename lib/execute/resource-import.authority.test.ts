import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameImport,
  FrameInt,
  FrameString,
  ResourceHandlers,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { HCEval } from "./hc-eval.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import {
  MODULE_PATH,
  MODULE_REFERENCE,
  RecordingHandler,
  RecordingStore,
  replaceElements,
  resourceWithSource,
  rootContext,
  runFrameImport,
} from "./resource-import.fixtures.test.ts";
import { CountingExpression } from "../test-helpers.test.ts";

describe("resource import: failure and authority", () => {
  it("passes through absent, unbound, escaped, and parent refusals", () => {
    const absentStore = new RecordingStore();
    const absent = evaluate(
      `. <- ${MODULE_REFERENCE}`,
      rootContext(absentStore),
    ).at(0);
    expect(absent.toString()).toEqual(
      "$!.resource-absent './module.hc'",
    );
    expect(absentStore.reads).toEqual([MODULE_PATH]);

    const unboundStore = new RecordingStore();
    const unbound = evaluate(
      ". <- 'https://example.com/module.hc'",
      rootContext(unboundStore),
    ).at(0);
    expect(unbound.toString()).toEqual(
      "$!.resource-scheme-unbound 'https://example.com/module.hc'",
    );
    expect(unboundStore.reads).toEqual([]);

    const escapedStore = new RecordingStore({}, "resource-escaped-root");
    const escaped = evaluate(
      `. <- ${MODULE_REFERENCE}`,
      rootContext(escapedStore),
    ).at(0);
    expect(escaped.toString()).toEqual(
      "$!.resource-escaped-root './module.hc'",
    );
    expect(escapedStore.reads).toEqual([MODULE_PATH]);

    const parentStore = new RecordingStore();
    const parent = evaluate(
      ". <- '../escape.hc'",
      rootContext(parentStore),
    ).at(0);
    expect(parent.toString()).toEqual(
      "$!.resource-parent-escape '../escape.hc'",
    );
    expect(parentStore.reads).toEqual([]);
  });

  it("passes through the exact failed element and stops before later source", () => {
    const file = new FrameArray([]);
    const resource = resourceWithSource("");
    const refusal = Frame.error("$!.fixture-refusal './module.hc'");
    let reads = 0;
    replaceElements(
      resource,
      [refusal, ...[...".later 1;"].map((char) => new FrameString(char))],
      () => reads += 1,
    );

    const result = new FrameImport(
      { kind: "local" },
      resource,
      evaluateResourceSource,
    ).in(EvaluationScope.root(file));

    expect(result).toBe(refusal);
    expect(reads).toEqual(1);
    expect(file.get_here("later").is.missing).toBe(true);
  });

  it("rejects non-character elements without a second read path", () => {
    const handler = new RecordingHandler({
      ok: true,
      elements: [new FrameInt("7")],
    });
    const output = evaluate(
      ". <- 'fixture:module'",
      rootContext(
        new RecordingStore(),
        ResourceHandlers.of({ fixture: handler }),
      ),
    );

    expect(output.at(0).toString()).toEqual(
      "$!.resource-import-source-type 7",
    );
    expect(handler.reads).toEqual(1);
  });

  it("preserves a successful named namespace across later failures", () => {
    const store = new RecordingStore({ [MODULE_PATH]: ".value 1;" });
    const output = new FrameArray([]);
    const evaluator = new HCEval(
      output,
      output,
      new Frame(rootContext(store)),
    );

    evaluator.call(`module <- ${MODULE_REFERENCE}`);
    const namespace = output.get_here("module");
    expect(namespace.get_here("value").toString()).toEqual("1");

    evaluator.call("module <- './absent.hc'");
    expect(output.get_here("module")).toBe(namespace);

    evaluator.call("module <- 7");
    expect(output.get_here("module")).toBe(namespace);

    store.write(MODULE_PATH, ".kept 2; .X 1; .X 2;");
    evaluator.call(`module <- ${MODULE_REFERENCE}`);
    expect(output.get_here("module")).toBe(namespace);
    expect(namespace.get_here("kept").is.missing).toBe(true);
  });

  it("does not read after malformed outer import syntax", () => {
    for (
      const source of [
        `<- ${MODULE_REFERENCE}`,
        `<-${MODULE_REFERENCE}`,
        `.invalid <- ${MODULE_REFERENCE}`,
        `_ <- ${MODULE_REFERENCE}`,
        `__ <- ${MODULE_REFERENCE}`,
        `_^ <- ${MODULE_REFERENCE}`,
        `_^^ <- ${MODULE_REFERENCE}`,
        "module <-",
        "module<-",
        `module<--${MODULE_REFERENCE}`,
        `module <- ${MODULE_REFERENCE} extra`,
      ]
    ) {
      const store = new RecordingStore({ [MODULE_PATH]: "1" });
      const output = evaluate(source, rootContext(store));

      expect(output.at(0).toString()).toContain(
        "$!.resource-import-syntax",
      );
      expect(output.at(0).toString()).not.toContain("$!.name-missing");
      expect(store.reads).toEqual([]);
      for (const target of ["_", "__", "_^", "_^^"]) {
        if (source.startsWith(`${target} `)) {
          expect(output.get_here(target).is.missing).toBe(true);
        }
      }
    }
  });

  it("reports a named setter failure only after source success", () => {
    const file = new FrameArray([]);
    file.set("Module", new FrameInt("1"));
    const resource = resourceWithSource("7");
    const expression = new CountingExpression(resource);
    const result = new FrameImport(
      { kind: "named", key: "Module" },
      expression,
      evaluateResourceSource,
    ).in(EvaluationScope.root(file));

    expect(result.toString()).toEqual("$error{$is-constant .Module}");
    expect(expression.calls).toEqual(1);
    expect(file.get_here("Module").toString()).toEqual("1");
  });

  it("passes through right-side failure and rejects an inert URI", () => {
    const file = new FrameArray([]);
    const scope = EvaluationScope.root(file);
    const failure = Frame.error("$!.right-side-failure");
    const failedExpression = new CountingExpression(failure);
    const failed = new FrameImport(
      { kind: "local" },
      failedExpression,
      evaluateResourceSource,
    ).in(scope);
    expect(failed).toBe(failure);
    expect(failedExpression.calls).toEqual(1);

    const inert = evaluate(`. <- ${MODULE_REFERENCE}`).at(0);
    expect(inert.toString()).toEqual(
      "$!.resource-import-source-type './module.hc'",
    );
  });

  for (
    const [source, diagnostic] of [
      ["”", "unmatched string terminator"],
      ["]", "$!.parse-unmatched-structure"],
      ["[)", "$!.parse-mismatched-structure"],
      ["[1", "$!.parse-unclosed-structure"],
      ["“unterminated", "unterminated FrameString"],
    ]
  ) {
    it(`retains completed state before source failure ${diagnostic}`, () => {
      const { file, result } = runFrameImport(`.kept 1; ${source}`);

      expect(result.isFailedResult()).toBe(true);
      expect(result.toString()).toContain(diagnostic);
      expect(file.get_here("kept").toString()).toEqual("1");
    });
  }

  it("does not expose a partially populated named namespace on failure", () => {
    const { file, result, evaluatedScope } = runFrameImport(
      ".kept 1; .X 1; .X 2; .later 3;",
      "module",
    );

    expect(result.toString()).toEqual("$error{$is-constant .X}");
    expect(file.get_here("module").is.missing).toBe(true);
    expect(evaluatedScope?.writeTarget.get_here("kept").toString()).toEqual(
      "1",
    );
    expect(evaluatedScope?.writeTarget.get_here("X").toString()).toEqual("1");
    expect(evaluatedScope?.writeTarget.get_here("later").is.missing).toBe(
      true,
    );
  });
});
