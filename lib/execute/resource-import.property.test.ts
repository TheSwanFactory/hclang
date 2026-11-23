import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArray,
  FrameExpr,
  FrameGroup,
  FrameImport,
  FrameInt,
  FrameName,
  FrameResource,
  FrameString,
  FrameSymbol,
} from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { LexPipe } from "./lex-pipe.ts";
import { ParsePipe } from "./parse-pipe.ts";
import { evaluateResourceSource } from "./resource-import.ts";
import {
  MODULE_PATH,
  MODULE_REFERENCE,
  RecordingStore,
  replaceElements,
  resourceWithSource,
  rootContext,
} from "./resource-import.fixtures.test.ts";

/**
 * Lexes and parses `chunks` as one source, scanned chunk by chunk, and
 * answers its first term, the import.
 */
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

/** A seeded xorshift32 generator, so each run repeats the same cases. */
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

/** How many generated cases each property checks. */
const PROPERTY_CASES = 100;

/**
 * Runs `verify` on `PROPERTY_CASES` cases from `generate`, and names the
 * seed, index and generated case of any failure.
 */
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

/** Splits `source` into consecutive chunks of one to five characters. */
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

describe("resource import: properties", () => {
  it("Feature: resource-import, Property 1: Named import parsing preserves target and source", () => {
    const seed = 0x1a2b3c01;
    runProperty(
      seed,
      (generator) => {
        const target = generator.identifier("module");
        const path = `${generator.identifier("path")}.hc`;
        const before = " ".repeat(generator.integer(4));
        const after = " ".repeat(generator.integer(4));
        const source = `${target}${before}<-${after}'./${path}'`;
        return {
          target,
          path,
          source,
          chunks: randomChunks(source, generator),
        };
      },
      ({ target, path, source, chunks }) => {
        const imported = parsedImport(chunks);
        expect(imported).toBeInstanceOf(FrameImport);
        expect(imported.target).toEqual({ kind: "named", key: target });
        expect(imported.resourceExpression.toString()).toEqual(`'./${path}'`);

        for (let split = 1; split < source.length; split += 1) {
          const splitImport = parsedImport([
            source.slice(0, split),
            source.slice(split),
          ]);
          expect(splitImport).toBeInstanceOf(FrameImport);
          expect(splitImport.target).toEqual({ kind: "named", key: target });
          expect(splitImport.resourceExpression.toString()).toEqual(
            `'./${path}'`,
          );
        }
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
    const scopeKinds = ["root", "call", "construction"] as const;
    runProperty(
      seed,
      (generator, index) => ({
        scopeKind: scopeKinds[index % scopeKinds.length],
        base: generator.identifier("base"),
        copy: generator.identifier("copy"),
        own: generator.identifier("own"),
        parentValue: 1 + generator.integer(500),
        ownValue: 501 + generator.integer(500),
      }),
      ({ scopeKind, base, copy, own, parentValue, ownValue }) => {
        const makeScope = (file: FrameArray): {
          scope: EvaluationScope;
          owner: Frame;
        } => {
          const root = EvaluationScope.root(file);
          if (scopeKind === "root") return { scope: root, owner: file };
          if (scopeKind === "call") {
            const scope = EvaluationScope.call(
              Frame.nil,
              Frame.nil,
              undefined,
              root,
            );
            return { scope, owner: scope.writeTarget };
          }
          const owner = new FrameArray([]);
          return { scope: root.withWriteTarget(owner), owner };
        };

        const source = `.${copy} ${base}; .${own} ${ownValue};\n${own}`;
        const directFile = new FrameArray([]);
        directFile.set(base, new FrameInt(`${parentValue}`));
        const direct = makeScope(directFile);
        let directResult: Frame = Frame.nil;
        for (
          const form of [
            new FrameExpr([
              new FrameName(copy),
              FrameSymbol.for(base),
            ]),
            new FrameExpr([
              new FrameName(own),
              new FrameInt(`${ownValue}`),
            ]),
            new FrameExpr([FrameSymbol.for(own)]),
          ]
        ) {
          directResult = form.in(direct.scope);
        }

        const importedFile = new FrameArray([]);
        importedFile.set(base, new FrameInt(`${parentValue}`));
        const importedSide = makeScope(importedFile);
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
        const result = imported.in(importedSide.scope);

        expect(seen).toBe(importedSide.scope);
        expect(result.toString()).toEqual(directResult.toString());
        expect(importedSide.owner.get_here(copy).toString()).toEqual(
          direct.owner.get_here(copy).toString(),
        );
        expect(importedSide.owner.get_here(own).toString()).toEqual(
          direct.owner.get_here(own).toString(),
        );
        if (scopeKind !== "root") {
          expect(importedFile.get_here(copy).is.missing).toBe(true);
          expect(importedFile.get_here(own).is.missing).toBe(true);
        }
      },
    );
  });

  it("Feature: resource-import, Property 5: Named imports isolate declarations behind a live parent", () => {
    const seed = 0x5a2b3c05;
    const scopeKinds = ["root", "call", "construction"] as const;
    runProperty(
      seed,
      (generator, index) => ({
        scopeKind: scopeKinds[index % scopeKinds.length],
        callLayer: Math.floor(index / scopeKinds.length) % 5,
        target: generator.identifier("module"),
        parent: generator.identifier("parent"),
        collision: generator.identifier("collision"),
        collisionCopy: generator.identifier("collisionCopy"),
        shadow: generator.identifier("shadow"),
        owned: generator.identifier("owned"),
        before: 1 + generator.integer(300),
        after: 301 + generator.integer(300),
        child: 601 + generator.integer(300),
      }),
      ({
        scopeKind,
        callLayer,
        target,
        parent,
        collision,
        collisionCopy,
        shadow,
        owned,
        before,
        after,
        child,
      }) => {
        const file = new FrameArray([]);
        const callers: Frame[] = [file];
        let scope = EvaluationScope.root(file);
        let targetOwner: Frame = file;
        let parentOwner: Frame = file;
        let collisionWinner: Frame = file;
        let collisionLoser: Frame | undefined;

        if (scopeKind === "call") {
          const argument = new FrameArray([]);
          const parameter = new FrameArray([]);
          const receiver = new FrameArray([]);
          const closure = new FrameArray([]);
          callers.push(argument, parameter, receiver, closure);
          const callLayers = [argument, parameter, receiver, closure, file];
          parentOwner = callLayers[callLayer];
          argument.set(collision, new FrameInt(`${before + 1}`));
          parameter.set(collision, new FrameInt(`${before + 2}`));
          collisionWinner = argument;
          collisionLoser = parameter;
          scope = EvaluationScope.call(
            argument,
            parameter,
            closure,
            EvaluationScope.root(file),
            { receiver, mutable: true, lexicalContext: file },
          );
          targetOwner = scope.writeTarget;
          callers.push(targetOwner);
        } else if (scopeKind === "construction") {
          const construction = new FrameArray([]);
          callers.push(construction);
          file.set(collision, new FrameInt(`${before + 1}`));
          construction.set(collision, new FrameInt(`${before + 2}`));
          collisionWinner = file;
          collisionLoser = construction;
          scope = EvaluationScope.root(file).withWriteTarget(construction);
          targetOwner = construction;
        } else {
          file.set(collision, new FrameInt(`${before + 1}`));
        }

        parentOwner.set(parent, new FrameInt(`${before}`));
        parentOwner.set(shadow, new FrameInt(`${before}`));
        let importedScope: EvaluationScope | undefined;
        const source = `.${owned} ${parent}; ` +
          `.${collisionCopy} ${collision}; .${shadow} ${child};`;
        const result = new FrameImport(
          { kind: "named", key: target },
          resourceWithSource(source),
          (value, childScope) => {
            importedScope = childScope;
            return evaluateResourceSource(value, childScope);
          },
        ).in(scope);
        const namespace = targetOwner.get_here(target);

        expect(result.isFailedResult()).toBe(false);
        expect(namespace).toBeInstanceOf(FrameArray);
        expect(targetOwner.get_here(target)).toBe(namespace);
        for (const caller of callers) {
          expect(caller.get_here(owned).is.missing).toBe(true);
          expect(caller.get_here(collisionCopy).is.missing).toBe(true);
        }
        expect(namespace.get_here(owned).toString()).toEqual(`${before}`);
        expect(namespace.get_here(collisionCopy).toString()).toEqual(
          `${before + 1}`,
        );
        expect(namespace.get(shadow).toString()).toEqual(`${child}`);
        expect(parentOwner.get_here(shadow).toString()).toEqual(`${before}`);
        expect(namespace.get(parent).toString()).toEqual(`${before}`);
        expect(importedScope?.writeTarget).toBe(namespace);
        expect(importedScope?.parameter).toBeUndefined();
        expect(importedScope?.receiverState).toBeUndefined();
        expect(importedScope?.lookupFrames()).toEqual([namespace]);

        parentOwner.set(parent, new FrameInt(`${after}`));
        expect(namespace.get(parent).toString()).toEqual(`${after}`);
        expect(namespace.get_here(owned).toString()).toEqual(`${before}`);
        if (collisionLoser) {
          collisionLoser.set(collision, new FrameInt(`${after + 1}`));
          expect(namespace.get(collision).toString()).toEqual(`${before + 1}`);
        }
        collisionWinner.set(collision, new FrameInt(`${after + 2}`));
        expect(namespace.get(collision).toString()).toEqual(`${after + 2}`);
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
        const completedOwner = form === "local"
          ? file
          : importedScope?.writeTarget;

        if (selected === "read") expect(result).toBe(refusal);
        if (selected === "parse") {
          expect(result.toString()).toContain("$!.parse-unmatched-structure");
        }
        if (selected === "evaluation") {
          expect(result.toString()).toEqual("$error{$is-constant .X}");
          expect(completedOwner?.get_here("X").toString()).toEqual("1");
        }
        for (const [index, key] of keys.entries()) {
          expect(completedOwner?.get_here(key).toString()).toEqual(
            `${value + index}`,
          );
        }
        expect(completedOwner?.get_here("later").is.missing).toBe(true);
        if (form === "named") {
          expect(file.get_here(target).is.missing).toBe(true);
          expect(importedScope?.writeTarget).toBe(completedOwner);
        } else {
          expect(importedScope?.writeTarget).toBe(file);
        }
      },
    );
  });
});
