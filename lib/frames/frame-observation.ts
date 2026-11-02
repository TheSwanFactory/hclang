import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameString } from "./frame-string.ts";
import { describedKind, kindOf, reasonOf } from "./error-kind.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";

/** A symbol's spelling, without importing `FrameSymbol` (load order). */
const spelling = (frame: Frame): string | undefined =>
  frame.className() === "FrameSymbol"
    ? (frame as unknown as { spelling(): string }).spelling()
    : undefined;

/**
 * The observations of the handlers now running, innermost last.
 *
 * This relies on evaluation being synchronous: a handler runs to completion
 * inside `during`, so pushes and pops nest exactly, and `finally` pops even
 * when evaluation throws. Nothing in `lib/` suspends evaluation (`HCLang.call`
 * returns a promise but evaluates synchronously before resolving it). If
 * evaluation ever suspends while a handler runs, this stack must move into the
 * evaluation context, or `$#` would leak into an interleaved evaluation.
 */
const running: FrameObservation[] = [];

/**
 * What a catch handler receives (spec a13/14 §6, §7): a non-propagating view
 * of one error.
 *
 * It holds the original error, never a copy, and is not itself an error.
 * `.!` reads the original, so answering it declines or re-raises with the
 * same frame; `.#` reads the reason as text. Any other member is missing. It
 * prints as `$#.reason`. A schema candidate written as an error kind matches
 * it when the kinds agree (`$# ~ <$!.division-by-zero>`).
 */
export class FrameObservation extends FrameAtom {
  public constructor(public readonly original: Frame) {
    super();
  }

  /** The observation of the innermost running handler, if any. */
  public static current(): FrameObservation | undefined {
    return running.at(-1);
  }

  /** Runs `body` with this as the current observation. */
  public during(body: () => Frame): Frame {
    running.push(this);
    try {
      return body();
    } finally {
      running.pop();
    }
  }

  /** The original's kind, `$!.reason` or `$!!.reason`. */
  public kind(): string | undefined {
    return kindOf(this.original);
  }

  public override matchesKind(candidate: Frame): boolean {
    const kind = this.kind();
    return kind !== undefined && describedKind(candidate) === kind;
  }

  /** `.!` is the original error, `.#` its reason; nothing else is a member. */
  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    switch (spelling(argument)) {
      case "!":
        return this.original;
      case "#":
        return new FrameString(reasonOf(this.original) ?? "");
      default:
        return Frame.error(
          `$!.name-missing ${this.toString()}${argument.toString()}`,
        );
    }
  }

  public override in(_input: EvaluationInput = []): Frame {
    return this;
  }

  public override toString(): string {
    return `$#.${reasonOf(this.original) ?? ""}`;
  }

  public override dataString(): string {
    return this.toString();
  }
}

/**
 * Evaluates a handler and handles `failure` with it, both with the
 * observation as the current `$#`. A closure is called with the observation;
 * any other value is the replacement itself. A handler that is itself an error
 * is the result (spec a13/12 §2.3).
 */
Frame.catchWith = (failure: Frame, evaluate: () => Frame): Frame => {
  const observation = new FrameObservation(failure);
  return observation.during(() => {
    const handler = evaluate();
    if (handler.isError()) return handler;
    return handler.isClosure() ? handler.call(observation) : handler;
  });
};
