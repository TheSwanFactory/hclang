import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  type EvaluationInput,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameExpr,
  FrameGroup,
  FrameImport,
  FrameInt,
  FrameResource,
  FrameString,
  type HandlerRead,
  type HandlerWrite,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  type ResourceStore,
  type SchemeHandler,
  type StoreResult,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { HCEval } from "./hc-eval.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import { evaluateResourceSource } from "./resource-import.ts";

const MODULE_PATH = "module.hc";
const MODULE_REFERENCE = "'./module.hc'";

class RecordingStore implements ResourceStore {
  public readonly reads: string[] = [];
  public readonly writes: string[] = [];
  readonly #contents = new Map<string, string>();

  public constructor(
    contents: Readonly<Record<string, string>> = {},
    private readonly refusal?: string,
  ) {
    for (const [path, content] of Object.entries(contents)) {
      this.#contents.set(path, content);
    }
  }

  public describe(): string {
    return "recording";
  }

  public read(path: string): StoreResult {
    this.reads.push(path);
    if (this.refusal) return { ok: false, reason: this.refusal };
    const content = this.#contents.get(path);
    return content === undefined
      ? { ok: false, reason: "resource-absent" }
      : { ok: true, content };
  }

  public write(path: string, content: string): StoreResult {
    this.writes.push(path);
    this.#contents.set(path, content);
    return { ok: true, content };
  }
}

class RecordingHandler implements SchemeHandler {
  public reads = 0;
  public writes = 0;

  public constructor(private readonly answer: HandlerRead) {}

  public describe(): string {
    return "recording-handler";
  }

  public read(): HandlerRead {
    this.reads += 1;
    return this.answer;
  }

  public write(_reference: never, _content: string): HandlerWrite {
    this.writes += 1;
    return { ok: false, reason: "read-only" };
  }
}

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

const rootContext = (
  store: ResourceStore,
  handlers: ResourceHandlers = ResourceHandlers.none,
): Record<string, Frame> => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(store, handlers),
});

const resourceWithSource = (
  source: string,
  store: ResourceStore = new MemoryStore(),
): FrameResource => {
  store.write(MODULE_PATH, source);
  return FrameResource.root(store).extend(`./${MODULE_PATH}`) as FrameResource;
};

const evaluateOuterImport = (
  importedSource: string,
  expression = `. <- ${MODULE_REFERENCE}`,
  store: ResourceStore = new MemoryStore(),
): FrameArray => {
  store.write(MODULE_PATH, importedSource);
  return evaluate(expression, rootContext(store));
};

const runFrameImport = (
  source: string,
  target: "." | string = ".",
): {
  file: FrameArray;
  resource: FrameResource;
  result: Frame;
  evaluatedScope?: EvaluationScope;
} => {
  const file = new FrameArray([]);
  const resource = resourceWithSource(source);
  let evaluatedScope: EvaluationScope | undefined;
  const imported = new FrameImport(
    target === "." ? { kind: "local" } : { kind: "named", key: target },
    resource,
    (value, scope) => {
      evaluatedScope = scope;
      return evaluateResourceSource(value, scope);
    },
  );
  const result = imported.in(EvaluationScope.root(file));
  return { file, resource, result, evaluatedScope };
};

const replaceElements = (
  resource: FrameResource,
  elements: readonly Frame[],
  onRead?: () => void,
): void => {
  Object.defineProperty(resource, "elements", {
    configurable: true,
    value: (): Frame[] => {
      onRead?.();
      return [...elements];
    },
  });
};

const parsedImport = (chunks: readonly string[]): FrameImport => {
  const output = new FrameArray([]);
  const parser = new ParsePipe(output, FrameGroup, {
    importSource: evaluateResourceSource,
  });
  const lexer = new LexPipe(parser);
  let receiver: Frame = lexer;
  for (const chunk of chunks) {
    receiver = new FrameString(chunk).scanInto(receiver, false);
  }
  new FrameString("").scanInto(receiver);

  const group = output.at(0) as FrameGroup;
  const expression = group.asArray()[0] as FrameExpr;
  return expression.asArray()[0] as FrameImport;
};

class SeededGenerator {
  public constructor(private state: number) {}

  public next(): number {
    let value = this.state | 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state;
  }

  public integer(limit: number): number {
    return this.next() % limit;
  }

  public identifier(prefix: string): string {
    return `${prefix}${this.integer(1_000_000).toString(36)}`;
  }
}

const PROPERTY_CASES = 100;

function runProperty<T>(
  seed: number,
  generate: (generator: SeededGenerator, index: number) => T,
  verify: (generated: T, index: number) => void,
): void {
  const generator = new SeededGenerator(seed);
  for (let index = 0; index < PROPERTY_CASES; index += 1) {
    const generated = generate(generator, index);
    try {
      verify(generated, index);
    } catch (error) {
      const detail = error instanceof Error
        ? error.stack ?? error.message
        : error;
      throw new Error(
        `seed=${seed} case=${index} generated=${
          JSON.stringify(generated)
        }\n${detail}`,
      );
    }
  }
}

function randomChunks(source: string, generator: SeededGenerator): string[] {
  const chunks: string[] = [];
  let offset = 0;
  while (offset < source.length) {
    const length = 1 + generator.integer(Math.min(5, source.length - offset));
    chunks.push(source.slice(offset, offset + length));
    offset += length;
  }
  return chunks;
}

describe("resource import", () => {
  describe("source evaluation", () => {
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
      expect(namespace.up).toBe(output);
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

    it("makes prior declarations visible to later lexical work", () => {
      const output = evaluateOuterImport(".size 1; \\size\\a");

      expect(output.at(0).toString()).toEqual("\\1\\a");
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

  describe("scope and namespace invariants", () => {
    it("passes the exact local scope and strips call authority from a child", () => {
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
      expect(child?.lookupFrames()).toEqual([namespace, file]);
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
  });

  describe("failure and authority", () => {
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

    it("does not read after malformed outer import syntax", () => {
      for (
        const source of [
          `<- ${MODULE_REFERENCE}`,
          `.invalid <- ${MODULE_REFERENCE}`,
          "module <-",
          `module <- ${MODULE_REFERENCE} extra`,
        ]
      ) {
        const store = new RecordingStore({ [MODULE_PATH]: "1" });
        const output = evaluate(source, rootContext(store));

        expect(output.at(0).toString()).toContain(
          "$!.resource-import-syntax",
        );
        expect(store.reads).toEqual([]);
      }
    });

    it("stops before the right side on named binding failure", () => {
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
      expect(expression.calls).toEqual(0);
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

    it("keeps the same partially populated named namespace on evaluation failure", () => {
      const { file, result, evaluatedScope } = runFrameImport(
        ".kept 1; .X 1; .X 2; .later 3;",
        "module",
      );
      const namespace = file.get_here("module");

      expect(result.toString()).toEqual("$error{$is-constant .X}");
      expect(namespace).toBe(evaluatedScope?.writeTarget);
      expect(namespace.get_here("kept").toString()).toEqual("1");
      expect(namespace.get_here("X").toString()).toEqual("1");
      expect(namespace.get_here("later").is.missing).toBe(true);
    });
  });

  it("Feature: resource-import, Property 1: Named import parsing preserves target and source", () => {
    const seed = 0x1a2b3c01;
    runProperty(
      seed,
      (generator) => {
        const target = generator.identifier("module");
        const path = `${generator.identifier("path")}.hc`;
        const before = " ".repeat(1 + generator.integer(3));
        const after = " ".repeat(1 + generator.integer(3));
        const source = `${target}${before}<-${after}'./${path}'`;
        return { target, path, chunks: randomChunks(source, generator) };
      },
      ({ target, path, chunks }) => {
        const imported = parsedImport(chunks);
        expect(imported).toBeInstanceOf(FrameImport);
        expect(imported.target).toEqual({ kind: "named", key: target });
        expect(imported.resourceExpression.toString()).toEqual(`'./${path}'`);
      },
    );
  });

  it("Feature: resource-import, Property 2: Every evaluation performs an ordered source read", () => {
    const seed = 0x2a2b3c02;
    runProperty(
      seed,
      (generator) => ({
        first: generator.identifier("first"),
        second: generator.identifier("second"),
        value: 1 + generator.integer(1_000),
        evaluations: 1 + generator.integer(3),
      }),
      ({ first, second, value, evaluations }) => {
        const source = `.${first} ${value}; .${second} ${first};\n${second}`;
        const direct = evaluate(source);
        const store = new RecordingStore({ [MODULE_PATH]: source });

        for (let count = 1; count <= evaluations; count += 1) {
          const imported = evaluate(
            `. <- ${MODULE_REFERENCE}`,
            rootContext(store),
          );
          expect(imported.at(0).toString()).toEqual(
            direct.at(-1).toString(),
          );
          expect(imported.get_here(first).toString()).toEqual(`${value}`);
          expect(imported.get_here(second).toString()).toEqual(`${value}`);
          expect(store.reads.length).toEqual(count);
        }
      },
    );
  });

  it("Feature: resource-import, Property 3: Resource authority outcomes pass through unchanged", () => {
    const seed = 0x3a2b3c03;
    runProperty(
      seed,
      (generator) => ({ reason: generator.identifier("refusal") }),
      ({ reason }) => {
        const fallback = new RecordingStore();
        const resource = FrameResource.root(fallback).extend(
          `./${MODULE_PATH}`,
        ) as FrameResource;
        const refusal = Frame.error(`$!.${reason} ${MODULE_REFERENCE}`);
        let reads = 0;
        replaceElements(resource, [refusal], () => reads += 1);

        const result = new FrameImport(
          { kind: "local" },
          resource,
          evaluateResourceSource,
        ).in(EvaluationScope.root(new FrameArray([])));

        expect(result).toBe(refusal);
        expect(reads).toEqual(1);
        expect(fallback.reads).toEqual([]);
      },
    );
  });

  it("Feature: resource-import, Property 4: Local import is scope-equivalent to direct evaluation", () => {
    const seed = 0x4a2b3c04;
    runProperty(
      seed,
      (generator) => ({
        base: generator.identifier("base"),
        copy: generator.identifier("copy"),
        own: generator.identifier("own"),
        parentValue: 1 + generator.integer(500),
        ownValue: 501 + generator.integer(500),
      }),
      ({ base, copy, own, parentValue, ownValue }) => {
        const source = `.${copy} ${base}; .${own} ${ownValue};\n${own}`;
        const directFile = new FrameArray([]);
        directFile.set(base, new FrameInt(`${parentValue}`));
        const directOut = new FrameArray([]);
        const direct = new HCEval(directOut, directFile);
        direct.call(source);
        direct.finish();

        const importedFile = new FrameArray([]);
        importedFile.set(base, new FrameInt(`${parentValue}`));
        const resource = resourceWithSource(source);
        let seen: EvaluationScope | undefined;
        const imported = new FrameImport(
          { kind: "local" },
          resource,
          (value, scope) => {
            seen = scope;
            return evaluateResourceSource(value, scope);
          },
        );
        const scope = EvaluationScope.root(importedFile);
        const result = imported.in(scope);

        expect(seen).toBe(scope);
        expect(result.toString()).toEqual(directOut.at(-1).toString());
        expect(importedFile.get_here(copy).toString()).toEqual(
          directFile.get_here(copy).toString(),
        );
        expect(importedFile.get_here(own).toString()).toEqual(
          directFile.get_here(own).toString(),
        );
      },
    );
  });

  it("Feature: resource-import, Property 5: Named imports isolate declarations behind a live parent", () => {
    const seed = 0x5a2b3c05;
    runProperty(
      seed,
      (generator) => ({
        target: generator.identifier("module"),
        parent: generator.identifier("parent"),
        shadow: generator.identifier("shadow"),
        owned: generator.identifier("owned"),
        before: 1 + generator.integer(300),
        after: 301 + generator.integer(300),
        child: 601 + generator.integer(300),
      }),
      ({ target, parent, shadow, owned, before, after, child }) => {
        const file = new FrameArray([]);
        file.set(parent, new FrameInt(`${before}`));
        file.set(shadow, new FrameInt(`${before}`));
        const source = `.${shadow} ${child}; .${owned} ${parent};`;
        const imported = new FrameImport(
          { kind: "named", key: target },
          resourceWithSource(source),
          evaluateResourceSource,
        );
        imported.in(EvaluationScope.root(file));
        const namespace = file.get_here(target);

        expect(namespace).toBeInstanceOf(FrameArray);
        expect(file.get_here(owned).is.missing).toBe(true);
        expect(namespace.get_here(owned).toString()).toEqual(`${before}`);
        expect(namespace.get(shadow).toString()).toEqual(`${child}`);
        expect(namespace.get(parent).toString()).toEqual(`${before}`);
        file.set(parent, new FrameInt(`${after}`));
        expect(namespace.get(parent).toString()).toEqual(`${after}`);
      },
    );
  });

  it("Feature: resource-import, Property 6: Repeated named imports have pairwise-distinct identity", () => {
    const seed = 0x6a2b3c06;
    runProperty(
      seed,
      (generator) => ({
        target: generator.identifier("module"),
        evaluations: 2 + generator.integer(4),
      }),
      ({ target, evaluations }) => {
        const file = new FrameArray([]);
        const imported = new FrameImport(
          { kind: "named", key: target },
          resourceWithSource(""),
          evaluateResourceSource,
        );
        const scope = EvaluationScope.root(file);
        const namespaces: Frame[] = [];

        for (let count = 0; count < evaluations; count += 1) {
          imported.in(scope);
          namespaces.push(file.get_here(target));
        }
        expect(new Set(namespaces).size).toEqual(evaluations);
      },
    );
  });

  it("Feature: resource-import, Property 7: Import state equals the successful prefix", () => {
    const seed = 0x7a2b3c07;
    runProperty(
      seed,
      (generator, index) => ({
        form: index % 2 === 0 ? "local" as const : "named" as const,
        phase: ["read", "parse", "evaluation"] as const,
        selectedPhase: index % 3,
        prefixLength: 1 + generator.integer(3),
        value: 1 + generator.integer(900),
        target: generator.identifier("module"),
      }),
      ({ form, phase, selectedPhase, prefixLength, value, target }) => {
        const keys = Array.from(
          { length: prefixLength },
          (_unused, index) => `kept${index}`,
        );
        const prefix = keys.map((key, index) => `.${key} ${value + index};`)
          .join(" ");
        const selected = phase[selectedPhase];
        const source = selected === "parse"
          ? `${prefix} ] .later 999;`
          : selected === "evaluation"
          ? `${prefix} .X 1; .X 2; .later 999;`
          : prefix;
        const file = new FrameArray([]);
        const resource = resourceWithSource(source);
        const refusal = Frame.error("$!.generated-read-refusal");
        if (selected === "read") {
          replaceElements(resource, [
            ...[...prefix].map((char) => new FrameString(char)),
            refusal,
            ...[...".later 999;"].map((char) => new FrameString(char)),
          ]);
        }
        let importedScope: EvaluationScope | undefined;
        const imported = new FrameImport(
          form === "local" ? { kind: "local" } : { kind: "named", key: target },
          resource,
          (valueFrame, scope) => {
            importedScope = scope;
            return evaluateResourceSource(valueFrame, scope);
          },
        );
        const result = imported.in(EvaluationScope.root(file));
        const owner = form === "local" ? file : file.get_here(target);

        if (selected === "read") expect(result).toBe(refusal);
        if (selected === "parse") {
          expect(result.toString()).toContain("$!.parse-unmatched-structure");
        }
        if (selected === "evaluation") {
          expect(result.toString()).toEqual("$error{$is-constant .X}");
          expect(owner.get_here("X").toString()).toEqual("1");
        }
        for (const [index, key] of keys.entries()) {
          expect(owner.get_here(key).toString()).toEqual(`${value + index}`);
        }
        expect(owner.get_here("later").is.missing).toBe(true);
        if (form === "named") {
          expect(file.get_here(target)).toBe(importedScope?.writeTarget);
        } else {
          expect(importedScope?.writeTarget).toBe(file);
        }
      },
    );
  });
});
