import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameImport,
  FrameResource,
  FrameString,
  MemoryStore,
  ResourceHandlers,
  type ResourceStore,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { HCEval } from "./hc-eval.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import {
  MODULE_PATH,
  MODULE_REFERENCE,
  RecordingHandler,
  RecordingStore,
  resourceWithSource,
  rootContext,
  runFrameImport,
} from "./resource-import.fixtures.test.ts";
import { CountingExpression } from "../test-helpers.test.ts";

/**
 * Writes `importedSource` to `MODULE_PATH` and evaluates `expression`, by
 * default a local import of it, with that store as the resource root.
 */
const evaluateOuterImport = (
  importedSource: string,
  expression = `. <- ${MODULE_REFERENCE}`,
  store: ResourceStore = new MemoryStore(),
): FrameArray => {
  store.write(MODULE_PATH, importedSource);
  return evaluate(expression, rootContext(store));
};

describe("resource import: source evaluation", () => {
  it("evaluates local source in the exact current declaration scope", () => {
    const output = evaluateOuterImport(".answer 42; answer");

    expect(output.at(0).toString()).toEqual("42");
    expect(output.get_here("answer").toString()).toEqual("42");
  });

  it("binds named source in a fresh child with caller fallback", () => {
    const store = new MemoryStore();
    store.write(MODULE_PATH, ".owned caller; owned");
    const output = evaluate(
      `.caller 7; module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );
    const namespace = output.get_here("module") as FrameArray;

    expect(namespace).toBeInstanceOf(FrameArray);
    expect(namespace.up).not.toBe(output);
    expect(namespace.get_here("owned").toString()).toEqual("7");
    expect(namespace.get("caller").toString()).toEqual("7");
    expect(output.get_here("owned").is.missing).toBe(true);
  });

  it("returns nil for empty source and only the final form otherwise", () => {
    const empty = runFrameImport("");
    const output = evaluateOuterImport("1; 2; 3");

    expect(empty.result).toBe(Frame.nil);
    expect(output.length()).toEqual(1);
    expect(output.at(0).toString()).toEqual("3");
  });

  it("preserves Unicode and multi-character resource elements", () => {
    const handler = new RecordingHandler({
      ok: true,
      elements: [new FrameString(".text “hé🙂”; text")],
    });
    const output = evaluate(
      ". <- 'fixture:module'",
      rootContext(
        new RecordingStore(),
        ResourceHandlers.of({ fixture: handler }),
      ),
    );

    expect(output.at(0).toString()).toEqual("“hé🙂”");
    expect(output.get_here("text").toString()).toEqual("“hé🙂”");
    expect(handler.reads).toEqual(1);
  });

  it("evaluates same-line and multiline forms in source order", () => {
    for (
      const source of [
        ".first 1; .second first; second",
        ".first 1;\n.second first;\nsecond",
      ]
    ) {
      const output = evaluateOuterImport(source);
      expect(output.at(0).toString()).toEqual("1");
      expect(output.get_here("first").toString()).toEqual("1");
      expect(output.get_here("second").toString()).toEqual("1");
    }
  });

  it("evaluates multiline arrays and closures", () => {
    const array = evaluateOuterImport(".x [\n1, 2\n]\nx");
    const closure = evaluateOuterImport(".f {\n_ + 1\n}\nf 2");

    expect(array.at(0).toString()).toEqual("[1, 2]");
    expect(array.get_here("x").toString()).toEqual("[1, 2]");
    expect(closure.at(0).toString()).toEqual("3");
  });

  it("skips testdoc example lines and runs the code around them", () => {
    const output = evaluateOuterImport(
      ".a 1;\n; .b 2;\n# 2\n; missing_name\n# $!.name-missing\n.c a;\nc",
    );

    expect(output.at(0).toString()).toEqual("1");
    expect(output.get_here("a").toString()).toEqual("1");
    expect(output.get_here("c").toString()).toEqual("1");
    expect(output.get_here("b").toString()).not.toEqual("2");
  });

  it("keeps `; ` in prose and a `;` that starts a line of code", () => {
    const prose = evaluateOuterImport(
      "```\n; prose, not an example\n```\n.d 4;\nd",
    );
    const bare = evaluateOuterImport(";.e 5;\n;\ne");

    expect(prose.at(0).toString()).toEqual("4");
    expect(bare.at(0).toString()).toEqual("5");
  });

  it("answers the failure of a form that a final held `;` completes (#524)", () => {
    // The one-byte payload is the newline, so the form is still open when the
    // `;` that ends it starts a line, where the example filter holds it until
    // the source ends.
    expect(evaluateOuterImport("1 / 0 \\1\\\n;").toString())
      .toEqual("[$!.division-by-zero /]");
    expect(evaluateOuterImport("2 \\1\\\n;").isFailedResult()).toBe(false);
  });
  it("answers an open structure the source ends inside (#524)", () => {
    expect(evaluateOuterImport("[").toString())
      .toEqual("[$!.parse-unclosed-structure 1]");
  });
  it("recognizes an example line split across resource elements", () => {
    const handler = new RecordingHandler({
      ok: true,
      elements: [
        new FrameString(".a 1;\n;"),
        new FrameString(" missing_name\n"),
        new FrameString(";"),
      ],
    });
    const output = evaluate(
      ". <- 'fixture:module'",
      rootContext(
        new RecordingStore(),
        ResourceHandlers.of({ fixture: handler }),
      ),
    );

    expect(output.get_here("a").toString()).toEqual("1");
    // This import ends in an empty statement: there is no result at .0.
    expect(output.isFailedResult()).toBe(false);
  });

  it("makes prior declarations visible to later lexical work", () => {
    const output = evaluateOuterImport(".size 1; \\size\\a");

    expect(output.at(0).toString()).toEqual("\\1\\a");
  });

  it("makes call-local declarations visible to later lexical work", () => {
    const file = new FrameArray([]);
    const scope = EvaluationScope.call(
      Frame.nil,
      Frame.nil,
      undefined,
      EvaluationScope.root(file),
    );
    const result = new FrameImport(
      { kind: "local" },
      resourceWithSource(".size 1; \\size\\a"),
      evaluateResourceSource,
    ).in(scope);

    expect(result.toString()).toEqual("\\1\\a");
    expect(scope.writeTarget.get_here("size").toString()).toEqual("1");
    expect(file.get_here("size").is.missing).toBe(true);
  });

  it("makes construction declarations visible to later lexical work", () => {
    const file = new FrameArray([]);
    const construction = new FrameArray([]);
    const scope = EvaluationScope.root(file).withWriteTarget(construction);
    const result = new FrameImport(
      { kind: "local" },
      resourceWithSource(".size 1; \\size\\a"),
      evaluateResourceSource,
    ).in(scope);

    expect(result.toString()).toEqual("\\1\\a");
    expect(construction.get_here("size").toString()).toEqual("1");
    expect(file.get_here("size").is.missing).toBe(true);
  });

  it("retains nested syntax and supports an import inside imported source", () => {
    const store = new MemoryStore();
    store.write("inner.hc", ".inner 9;");
    store.write("outer.hc", ". <- './inner.hc'; [inner, [2]]");
    const output = evaluate(
      ". <- './outer.hc'",
      rootContext(store),
    );

    expect(output.at(0).toString()).toEqual("[9, [2]]");
    expect(output.get_here("inner").toString()).toEqual("9");
  });

  it("stops a self-import before rereading and clears the active chain", () => {
    const store = new RecordingStore({
      [MODULE_PATH]: ".started 1; . <- './module.hc'; .later 2;",
    });
    const output = new FrameArray([]);
    const host = new Frame(rootContext(store));
    const evaluator = new HCEval(output, output, host);

    evaluator.call(`. <- ${MODULE_REFERENCE}`);

    expect(output.at(0).toString()).toEqual(
      "$!.resource-import-cycle './module.hc'",
    );
    expect(store.reads).toEqual([MODULE_PATH]);
    expect(output.get_here("started").toString()).toEqual("1");
    expect(output.get_here("later").is.missing).toBe(true);

    store.write(MODULE_PATH, "7");
    evaluator.call(`. <- ${MODULE_REFERENCE}`);

    expect(output.at(1).toString()).toEqual("7");
    expect(store.reads).toEqual([MODULE_PATH, MODULE_PATH]);
  });

  it("stops a mutual import at the repeated read prefix", () => {
    const store = new RecordingStore({
      "a.hc": ".aStarted 1; . <- './b.hc'; .aLater 3;",
      "b.hc": ".bStarted 2; . <- './a.hc'; .bLater 4;",
    });
    const output = evaluate(". <- './a.hc'", rootContext(store));

    expect(output.at(0).toString()).toEqual(
      "$!.resource-import-cycle './a.hc'",
    );
    expect(store.reads).toEqual(["a.hc", "b.hc"]);
    expect(output.get_here("aStarted").toString()).toEqual("1");
    expect(output.get_here("bStarted").toString()).toEqual("2");
    expect(output.get_here("aLater").is.missing).toBe(true);
    expect(output.get_here("bLater").is.missing).toBe(true);
  });

  it("evaluates the right side and reads elements once per evaluation", () => {
    const store = new RecordingStore({ [MODULE_PATH]: "7" });
    const resource = FrameResource.root(store).extend(
      `./${MODULE_PATH}`,
    ) as FrameResource;
    const expression = new CountingExpression(resource);
    const imported = new FrameImport(
      { kind: "local" },
      expression,
      evaluateResourceSource,
    );
    const scope = EvaluationScope.root(new FrameArray([]));

    expect(imported.in(scope).toString()).toEqual("7");
    expect(imported.in(scope).toString()).toEqual("7");
    expect(expression.calls).toEqual(2);
    expect(store.reads).toEqual([MODULE_PATH, MODULE_PATH]);
  });
});
