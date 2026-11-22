import { renderResults } from "./execute.ts";
import { evaluateInto } from "./evaluate.ts";
import { make_context } from "./hc-eval.ts";
import {
  type Context,
  contextString,
  Frame,
  FrameArray,
  MemoryStore,
  type StringMap,
} from "../frames.ts";
import { hostNamespace } from "./host-namespace.ts";

/** One submitted source string and its rendered output. */
export type HistoryPair = { input: string; output: string };

/**
 * Stateful HC session used by interactive clients such as the web playground.
 *
 * Submitted calls share one file/module scope, while constructor values live in
 * a distinct host namespace reached only through `$$`. `reset()` replaces both
 * namespaces and clears history.
 */
export class HCLang {
  /** Host bindings supplied by the embedding application. */
  private context: Context;
  /** Persistent declarations for this interactive source unit. */
  private fileScope: Frame;
  /** Stable frame exposing `context` through the explicit host anchor. */
  private hostNamespace: Frame;
  /** Each submitted source string and its rendered output or error, in order. */
  protected history: HistoryPair[];

  /**
   * Starts a session with an empty file scope and no history.
   *
   * @param environment String values for the host namespace, reached through
   *   `$$`; each becomes a Frame as `make_context` converts it.
   */
  public constructor(environment: StringMap = {}) {
    this.context = make_context(environment);
    this.fileScope = new Frame();
    this.hostNamespace = hostNamespace(
      this.context,
      new MemoryStore("session"),
    );
    this.history = [];
  }

  /** Returns the host namespace supplied by the embedding application. */
  public getContextString(): string {
    return contextString(this.context);
  }

  /**
   * Evaluates one submission in this session's persistent file scope.
   *
   * A declaration made by one call is visible to later calls through a bare
   * name or `$`; host values require `$$` on every call.
   */
  public call(input: string): Promise<string> {
    try {
      const out = new FrameArray([]);
      evaluateInto(input, out, this.fileScope, this.hostNamespace);
      const result = renderResults(out);
      this.history.push({ input, output: result });
      return Promise.resolve(result);
    } catch (error) {
      const errorMsg = error instanceof Error
        ? `Error: ${error.message}`
        : "Unknown error";
      this.history.push({ input, output: errorMsg });
      return Promise.resolve(errorMsg);
    }
  }

  /** Returns all submissions and rendered results in order. */
  public getHistory(): HistoryPair[] {
    return this.history;
  }

  /** Clears file declarations, host bindings, and history. */
  public reset(): void {
    this.context = make_context({});
    this.fileScope = new Frame();
    this.hostNamespace = hostNamespace(
      this.context,
      new MemoryStore("session"),
    );
    this.history = [];
  }
}
