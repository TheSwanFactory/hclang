/**
 * Research spike for spec a13/13: use-site recovery against the v0.39.0
 * interpreter. Not part of the shipped runtime, and not wired into
 * `deno task test:all`; `spike.test.ts` runs it.
 *
 * It answers 12c §5's two open questions:
 *
 * 1. **The observation protocol.** {@link Observation} is what a handler
 *    receives: an ordinary value whose `.reason` is text, whose `.error` is the
 *    original error frame (reading it propagates, which is how a handler
 *    declines), and whose spelling is its reason as a named literal, so
 *    `obs ~ <$!.reason>` matches through the existing enumeration matcher.
 * 2. **Receiver dispatch versus a recovery boundary.** Variant A,
 *    {@link Recover}, is an ordinary host-bound receiver: `$$.recover {E} H`.
 *    It needs no evaluator change because it receives `E` unevaluated, as a
 *    block. Variant B, {@link installCatchBoundary}, is the eager infix form
 *    `E catch H`; it needs a narrow change to expression reduction, applied
 *    here by replacing `FrameExpr.evaluateTerms` at runtime.
 *
 * `catch` is a placeholder spelling chosen because it lexes as one name and is
 * unbound; spec 11 §8 leaves the real spelling open.
 *
 * @module
 */
import {
  type EvaluationScope,
  Frame,
  FrameExpr,
  FrameString,
  FrameSymbol,
} from "../../lib/frames.ts";

/** Failure labels and their reasons, read with spec 10 §6.1's grammar. */
const REASON = /^\$(?:!|>|<>|-)\.([A-Za-z_][A-Za-z0-9_-]*)/;

/** The named reason of an error, or undefined when it has none (12b §3.4). */
export const reasonOf = (error: Frame): string | undefined =>
  REASON.exec(error.toString())?.[1];

/**
 * What a handler receives: a non-propagating view of one error (12 §3).
 *
 * The original error is stored, never copied or unflagged (12 §3.1), and is
 * readable as `.error`. Its spelling is `$!.<reason>`, so the enumeration
 * matcher's string equality makes `obs ~ <$!.reason>` a reason match for any
 * failure label (12c §2). An error with no reason spells as `$!` and matches
 * no named kind.
 */
export class Observation extends Frame {
  public readonly original: Frame;
  private readonly spelling: string;

  public constructor(original: Frame) {
    super();
    this.original = original;
    const reason = reasonOf(original);
    this.spelling = reason === undefined ? "$!" : `$!.${reason}`;
    this.set("error", original);
    this.set("reason", new FrameString(reason ?? ""));
    this.set("text", new FrameString(original.toString()));
  }

  public override toString(): string {
    return this.spelling;
  }

  public override dataString(): string {
    return this.spelling;
  }
}

/** Calls a handler with an observation of the failure (12 §4.1). */
export const invokeHandler = (handler: Frame, failure: Frame): Frame =>
  handler.call(new Observation(failure));

/** Runs a block, as `{…} ()` does. */
const runBlock = (block: Frame): Frame => block.call(Frame.nil);

/** Variant A's second step: `$$.recover {E}` waiting for its handler. */
class RecoverBlock extends Frame {
  public constructor(private readonly block: Frame) {
    super();
  }

  public override call(handler: Frame): Frame {
    const result = runBlock(this.block);
    return result.isError() ? invokeHandler(handler, result) : result;
  }

  public override toString(): string {
    return `recover(${this.block.toString()})`;
  }
}

/**
 * Variant A: a host-bound receiver, `$$.recover {E} H`.
 *
 * Bound as `evaluate(source, { recover: new Recover() })`. It overrides `call`
 * so that it receives the block itself rather than the block's own dispatch.
 */
export class Recover extends Frame {
  public override call(block: Frame): Frame {
    return new RecoverBlock(block);
  }

  public override toString(): string {
    return "recover";
  }
}

/**
 * Variant C, the control: an eager receiver, `$$.catcher E H`, which would see
 * `E` only if a failing term could reach a receiver. It records whether it was
 * ever reached.
 */
export class EagerCatcher extends Frame {
  public reached = 0;

  public override call(value: Frame): Frame {
    this.reached++;
    return value;
  }
}

type Terms = (terms: readonly Frame[], scope: EvaluationScope) => Frame;
type Reducer = { evaluateTerms: Terms };

/** The spelling variant B's boundary looks for between terms. */
export const CATCH = "catch";

/** A bare word reaches the reducer as a symbol, not an address or a name. */
const isCatch = (term: Frame): boolean =>
  term instanceof FrameSymbol && term.is.address !== true &&
  term.spelling() === CATCH;

/**
 * Variant B: install the eager boundary `E catch H₁ catch H₂ …`.
 *
 * Within one expression's terms, the segments between `catch` names reduce
 * left to right. The guarded segment reduces with the original rule. Each
 * handler segment is evaluated only when the result so far is an error (so a
 * success never evaluates it), and the handler is then called with an
 * observation. Expressions with no `catch` term are reduced exactly as before.
 *
 * @returns A function that restores the original reducer.
 */
export function installCatchBoundary(): () => void {
  const reducer = FrameExpr as unknown as Reducer;
  const original = reducer.evaluateTerms;
  reducer.evaluateTerms = (terms, scope) => {
    if (!terms.some(isCatch)) return original(terms, scope);
    const segments: Frame[][] = [[]];
    for (const term of terms) {
      if (isCatch(term)) segments.push([]);
      else segments.at(-1)!.push(term);
    }
    const [guarded, ...handlers] = segments;
    let result = original(guarded, scope);
    for (const segment of handlers) {
      if (!result.isError()) continue;
      const handler = original(segment, scope);
      result = handler.isError() ? handler : invokeHandler(handler, result);
    }
    return result;
  };
  return () => {
    reducer.evaluateTerms = original;
  };
}
