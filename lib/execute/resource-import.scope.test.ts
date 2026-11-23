import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameImport,
  FrameInt,
  MemoryStore,
} from "../frames.ts";
import { FrameHandle } from "../frames/frame-handle.ts";
import { evaluate } from "./evaluate.ts";
import { HCEval } from "./hc-eval.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import {
  MODULE_PATH,
  MODULE_REFERENCE,
  resourceWithSource,
  rootContext,
} from "./resource-import.fixtures.test.ts";

describe("resource import: scope and namespace invariants", () => {
  it("passes the exact local scope and isolates named-child authority", () => {
    const file = new FrameArray([]);
    const host = new Frame({ host: new FrameInt("1") });
    const scope = EvaluationScope.root(file, host);
    const resource = resourceWithSource("");
    let localScope: EvaluationScope | undefined;
    new FrameImport(
      { kind: "local" },
      resource,
      (_value, importedScope) => {
        localScope = importedScope;
        return Frame.nil;
      },
    ).in(scope);
    expect(localScope).toBe(scope);

    let child: EvaluationScope | undefined;
    new FrameImport(
      { kind: "named", key: "module" },
      resource,
      (_value, importedScope) => {
        child = importedScope;
        return Frame.nil;
      },
    ).in(scope);
    const namespace = file.get_here("module");

    expect(child?.argument).toBe(namespace);
    expect(child?.writeTarget).toBe(namespace);
    expect(child?.lexicalTarget).toBe(namespace);
    expect(child?.fileScope).toBe(namespace);
    expect(child?.hostNamespace).toBe(host);
    expect(child?.enclosing).toBe(scope);
    expect(child?.parameter).toBeUndefined();
    expect(child?.receiverState).toBeUndefined();
    expect(child?.lookupFrames()).toEqual([namespace]);
    expect(namespace.up).not.toBe(file);
  });

  it("retains exact construction precedence and live named fallback", () => {
    const file = new FrameArray([]);
    const construction = new FrameArray([]);
    file.set("collision", new FrameInt("1"));
    file.set("fileOnly", new FrameInt("2"));
    construction.set("collision", new FrameInt("3"));
    construction.set("constructionOnly", new FrameInt("4"));
    const scope = EvaluationScope.root(file).withWriteTarget(construction);
    let child: EvaluationScope | undefined;
    const result = new FrameImport(
      { kind: "named", key: "module" },
      resourceWithSource(
        ".during collision; .fromFile fileOnly; " +
          ".fromConstruction constructionOnly; .collision 9;",
      ),
      (value, importedScope) => {
        child = importedScope;
        return evaluateResourceSource(value, importedScope);
      },
    ).in(scope);
    const namespace = construction.get_here("module");

    expect(result.isFailedResult()).toBe(false);
    expect(file.get_here("module").is.missing).toBe(true);
    expect(construction.get_here("during").is.missing).toBe(true);
    expect(namespace.get_here("during").toString()).toEqual("1");
    expect(namespace.get_here("fromFile").toString()).toEqual("2");
    expect(namespace.get_here("fromConstruction").toString()).toEqual("4");
    expect(namespace.get_here("collision").toString()).toEqual("9");
    expect(file.get_here("collision").toString()).toEqual("1");
    expect(construction.get_here("collision").toString()).toEqual("3");
    expect(namespace.get("fileOnly").toString()).toEqual("2");
    expect(namespace.get("constructionOnly").toString()).toEqual("4");

    file.set("fileOnly", new FrameInt("5"));
    construction.set("constructionOnly", new FrameInt("6"));
    expect(namespace.get("fileOnly").toString()).toEqual("5");
    expect(namespace.get("constructionOnly").toString()).toEqual("6");
    expect(child?.writeTarget).toBe(namespace);
    expect(child?.receiverState).toBeUndefined();
  });

  it("retains every independent call lookup layer in order", () => {
    const file = new FrameArray([]);
    const argument = new FrameArray([]);
    const parameter = new FrameArray([]);
    const closure = new FrameArray([]);
    const receiver = new FrameArray([]);
    file.set("fileOnly", new FrameInt("1"));
    argument.set("argumentOnly", new FrameInt("2"));
    argument.set("collision", new FrameInt("3"));
    parameter.set("parameterOnly", new FrameInt("4"));
    parameter.set("collision", new FrameInt("5"));
    closure.set("closureOnly", new FrameInt("6"));
    receiver.set("receiverOnly", new FrameInt("7"));
    const root = EvaluationScope.root(file);
    const scope = EvaluationScope.call(
      argument,
      parameter,
      closure,
      root,
      { receiver, mutable: true, lexicalContext: file },
    );
    scope.writeTarget.set("localOnly", new FrameInt("8"));
    let child: EvaluationScope | undefined;
    const result = new FrameImport(
      { kind: "named", key: "module" },
      resourceWithSource(
        ".fromLocal localOnly; .fromArgument argumentOnly; " +
          ".fromParameter parameterOnly; .fromReceiver receiverOnly; " +
          ".fromClosure closureOnly; .fromFile fileOnly; " +
          ".fromCollision collision; .argumentOnly 9;",
      ),
      (value, importedScope) => {
        child = importedScope;
        return evaluateResourceSource(value, importedScope);
      },
    ).in(scope);
    const namespace = scope.writeTarget.get_here("module");

    expect(result.isFailedResult()).toBe(false);
    expect(namespace.get_here("fromLocal").toString()).toEqual("8");
    expect(namespace.get_here("fromArgument").toString()).toEqual("2");
    expect(namespace.get_here("fromParameter").toString()).toEqual("4");
    expect(namespace.get_here("fromReceiver").toString()).toEqual("7");
    expect(namespace.get_here("fromClosure").toString()).toEqual("6");
    expect(namespace.get_here("fromFile").toString()).toEqual("1");
    expect(namespace.get_here("fromCollision").toString()).toEqual("3");
    expect(namespace.get_here("argumentOnly").toString()).toEqual("9");
    expect(argument.get_here("argumentOnly").toString()).toEqual("2");
    expect(argument.get_here("module").is.missing).toBe(true);
    expect(parameter.get_here("module").is.missing).toBe(true);
    expect(file.get_here("module").is.missing).toBe(true);

    argument.set("collision", new FrameInt("10"));
    parameter.set("parameterOnly", new FrameInt("11"));
    receiver.set("receiverOnly", new FrameInt("12"));
    closure.set("closureOnly", new FrameInt("13"));
    file.set("fileOnly", new FrameInt("14"));
    expect(namespace.get("collision").toString()).toEqual("10");
    expect(namespace.get("parameterOnly").toString()).toEqual("11");
    expect(namespace.get("receiverOnly").toString()).toEqual("12");
    expect(namespace.get("closureOnly").toString()).toEqual("13");
    expect(namespace.get("fileOnly").toString()).toEqual("14");
    expect(child?.writeTarget).toBe(namespace);
    expect(child?.parameter).toBeUndefined();
    expect(child?.receiverState).toBeUndefined();
  });

  it("does not inherit caller mutation or receiver authority", () => {
    const capabilities = evaluate(
      ".box_ [.value 1; .write_ {@value _;}]; " +
        ".receiver_ [.value 2; .write_ {@value _;}];",
    );
    const box = capabilities.get_here("box_");
    const receiver = capabilities.get_here("receiver_");
    const file = new FrameArray([]);
    const argument = new FrameArray([]);
    argument.set("box_", box);
    argument.set("callerValue", new FrameInt("3"));
    const scope = EvaluationScope.call(
      argument,
      Frame.nil,
      undefined,
      EvaluationScope.root(file),
      { receiver, mutable: true, lexicalContext: file },
    );
    let child: EvaluationScope | undefined;
    const result = new FrameImport(
      { kind: "named", key: "module" },
      resourceWithSource("box_.write_ 9; write_ 10"),
      (value, importedScope) => {
        child = importedScope;
        return evaluateResourceSource(value, importedScope);
      },
    ).in(scope);

    expect(result.isFailedResult()).toBe(false);
    expect(box.get_here("value").toString()).toEqual("1");
    expect(receiver.get_here("value").toString()).toEqual("2");
    expect(child?.writeTarget).toBe(scope.writeTarget.get_here("module"));
    expect(child?.receiverState).toBeUndefined();

    const aliased = new FrameImport(
      { kind: "named", key: "aliasModule" },
      resourceWithSource("@callerValue 11"),
      evaluateResourceSource,
    ).in(scope);
    expect(aliased.toString()).toContain("$!.read-only-scope @callerValue");
    expect(argument.get_here("callerValue").toString()).toEqual("3");
  });

  it("refuses a named import's alias of a caller binding (#441)", () => {
    // The caller is read through a read-only view, so the alias is refused
    // rather than answering as though it wrote: the write used to land on
    // the view, and neither the caller nor the module held it.
    const file = new FrameArray([]);
    file.set("a", new FrameInt("1"));
    const scope = EvaluationScope.root(file);
    const named = new FrameImport(
      { kind: "named", key: "module" },
      resourceWithSource(".r (@a 5);"),
      evaluateResourceSource,
    ).in(scope);

    expect(named.isFailedResult()).toBe(true);
    expect(named.toString()).toContain("$!.read-only-scope @a");
    expect(file.get_here("a").toString()).toEqual("1");
    expect(file.get_here("module").is.missing).toBe(true);

    // A local import evaluates in the caller's own scope, so it writes.
    new FrameImport(
      { kind: "local" },
      resourceWithSource(".r (@a 5);"),
      evaluateResourceSource,
    ).in(scope);
    expect(file.get_here("a").toString()).toEqual("5");
  });

  it("keeps named declarations owned by the child and shadows the caller", () => {
    const store = new MemoryStore();
    store.write(MODULE_PATH, ".shared 9; .owned shared;");
    const output = evaluate(
      `.shared 1; module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );
    const namespace = output.get_here("module");

    expect(output.get_here("shared").toString()).toEqual("1");
    expect(output.get_here("owned").is.missing).toBe(true);
    expect(namespace.get_here("shared").toString()).toEqual("9");
    expect(namespace.get_here("owned").toString()).toEqual("9");
  });

  it("observes live caller replacement through an imported closure", () => {
    const store = new MemoryStore();
    store.write(MODULE_PATH, ".read {parent};");
    const output = new FrameArray([]);
    const host = new Frame(rootContext(store));
    const evaluator = new HCEval(output, output, host);

    evaluator.call(".parent 1");
    evaluator.call(`module <- ${MODULE_REFERENCE}`);
    evaluator.call(".parent 2");
    evaluator.call("module.read()");

    expect(output.at(-1).toString()).toEqual("2");
  });

  it("resolves caller binding schemas at top level and in a closure", () => {
    const store = new MemoryStore();
    store.write(
      MODULE_PATH,
      ".top [one.<^>]; .f { one.<^> }; f()",
    );
    const output = new FrameArray([]);
    const evaluator = new HCEval(
      output,
      output,
      new Frame(rootContext(store)),
    );
    evaluator.call(".one <1> 1");
    evaluator.call(`module <- ${MODULE_REFERENCE}`);
    const namespace = output.get_here("module");

    expect(output.at(-1).toString()).toEqual("<1>");
    expect(namespace.get_here("top").toString()).toEqual("[<1>]");
  });

  it("reuses safe live projections and replaces them after rebinding", () => {
    const caller = evaluate(
      ".box_ [.value 1; .write_ {@value _;}]; " +
        ".replacement [.value 2; .write_ {@value _;}];",
    );
    const original = caller.get_here("box_");
    const replacement = caller.get_here("replacement");
    const namespace = new FrameArray([]);
    EvaluationScope.root(caller).namedChild(namespace);

    const first = namespace.get("box_") as FrameHandle;
    const repeated = namespace.get("box_") as FrameHandle;

    expect(first).toBeInstanceOf(FrameHandle);
    expect(repeated).toBe(first);
    expect(first.isMutable()).toBe(false);
    first.get("write_").call(new FrameInt("9"));
    expect(original.get_here("value").toString()).toEqual("1");

    caller.set("box_", replacement);
    const rebound = namespace.get("box_") as FrameHandle;
    expect(rebound).toBeInstanceOf(FrameHandle);
    expect(rebound).not.toBe(first);
    expect(rebound.unwrap()).toBe(replacement);
    expect(rebound.get("value").toString()).toEqual("2");
  });

  it("allocates pairwise-fresh namespaces on repeated evaluation", () => {
    const file = new FrameArray([]);
    const scope = EvaluationScope.root(file);
    const imported = new FrameImport(
      { kind: "named", key: "module" },
      resourceWithSource(""),
      evaluateResourceSource,
    );
    const namespaces: Frame[] = [];

    for (let count = 0; count < 4; count += 1) {
      imported.in(scope);
      namespaces.push(file.get_here("module"));
    }

    expect(new Set(namespaces).size).toEqual(namespaces.length);
    expect(file.get_here("module")).toBe(namespaces.at(-1));
  });

  it("keeps a caller's frame identity through an imported closure", () => {
    // An imported operation handed a frame built by the importer answers
    // that frame itself, not a copy, and compares identity with `===`. This
    // was hc/modules.hc's Withness example, kept without the Figure API.
    const store = new MemoryStore();
    store.write(
      MODULE_PATH,
      ".first {_ .0}; .same {.x _; {.y _; x === y}}; .fresh {[[]]};",
    );
    const output = evaluate(
      `module <- ${MODULE_REFERENCE}; .a [[]]; .pair [a, [[]]]; ` +
        "[(module.first pair) === a, module.same a a, module.same a [[]], " +
        "module.same (module.fresh ()) (module.fresh ())]",
      rootContext(store),
    );

    expect(output.at(-1).asArray().at(-1)!.toString()).toEqual(
      "[<>, <>, (), ()]",
    );
  });

  it("curries operators on imported values with their own operand", () => {
    const store = new MemoryStore();
    store.write(
      MODULE_PATH,
      ".n 1; .u [[]]; .r [n = 1, n = n, u = u, (u .0) = []];",
    );
    const output = evaluate(
      `module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );

    expect(output.get_here("module").get_here("r").toString()).toEqual(
      "[<>, <>, <>, <>]",
    );
  });

  it("curries operators through a named import inside a named import", () => {
    const store = new MemoryStore();
    store.write("inner.hc", ".n 1; .u [[]];");
    store.write(
      MODULE_PATH,
      [
        "inner <- './inner.hc';",
        ".r [inner.n = 1, inner.n + 1, inner.u = [[]], (inner.u .0) = []];",
      ].join("\n"),
    );
    const output = evaluate(
      `module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );

    expect(output.get_here("module").get_here("r").toString()).toEqual(
      "[<>, 2, <>, <>]",
    );
  });

  it("applies operators to caller values reached through live lookup", () => {
    const store = new MemoryStore();
    store.write(MODULE_PATH, ".r [caller = 7, caller + 1];");
    const output = evaluate(
      `.caller 7; module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );

    expect(output.get_here("module").get_here("r").toString()).toEqual(
      "[<>, 8]",
    );
  });

  it("maps, reduces, and recurses over imported values while importing", () => {
    const store = new MemoryStore();
    store.write(
      MODULE_PATH,
      [
        ".u [[]]; .xs [1, 2, 3];",
        ".count {(_ = u) ? {[u]} : {(__ & {count _})}};",
        ".r [xs & {_ * 2}, xs | [], count [u, u]];",
      ].join("\n"),
    );
    const output = evaluate(
      `module <- ${MODULE_REFERENCE}`,
      rootContext(store),
    );

    expect(output.get_here("module").get_here("r").toString()).toEqual(
      "[[2, 4, 6], [1, 2, 3], [[[[]]], [[[]]]]]",
    );
  });
});
