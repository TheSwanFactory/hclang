/**
 * Fixtures shared by the resource-import test files.
 *
 * Named `.test.ts` on purpose: `deno test` loads it and runs 0 tests,
 * `lib/load-order.test.ts` skips it, and the coverage and publish
 * exclusions treat it as test code.
 */
import {
  type EvaluationInput,
  EvaluationScope,
  Frame,
  FrameArray,
  FrameImport,
  FrameResource,
  type HandlerRead,
  type HandlerWrite,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  type ResourceStore,
  type SchemeHandler,
  type StoreResult,
} from "../frames.ts";
import { evaluateResourceSource } from "./resource-import.ts";

export const MODULE_PATH = "module.hc";

export const MODULE_REFERENCE = "'./module.hc'";

export class RecordingStore implements ResourceStore {
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

export class RecordingHandler implements SchemeHandler {
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

export class CountingExpression extends Frame {
  public calls = 0;

  public constructor(private readonly answer: Frame) {
    super();
  }

  public override in(_input: EvaluationInput = []): Frame {
    this.calls += 1;
    return this.answer;
  }
}

export const rootContext = (
  store: ResourceStore,
  handlers: ResourceHandlers = ResourceHandlers.none,
): Record<string, Frame> => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(store, handlers),
});

export const resourceWithSource = (
  source: string,
  store: ResourceStore = new MemoryStore(),
): FrameResource => {
  store.write(MODULE_PATH, source);
  return FrameResource.root(store).extend(`./${MODULE_PATH}`) as FrameResource;
};

export const runFrameImport = (
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

export const replaceElements = (
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
