import { renderResults } from "./execute.ts";
import { HCEval, make_context } from "./hc-eval.ts";
import {
  type Context,
  contextString,
  Frame,
  FrameArray,
  type StringMap,
} from "../frames.ts";

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
  protected history: HistoryPair[];

  public constructor(environment: StringMap = {}) {
    this.context = make_context(environment);
    this.fileScope = new Frame();
    this.hostNamespace = new Frame(this.context);
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
      const evaluator = new HCEval(
        out,
        this.fileScope,
        this.hostNamespace,
      );
      evaluator.call(input);
      if (!evaluator.finish()) {
        out.apply(
          Frame.error(evaluator.error() ?? "incomplete lexical input"),
          Frame.nil,
        );
      }
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
    this.hostNamespace = new Frame(this.context);
    this.history = [];
  }
}
