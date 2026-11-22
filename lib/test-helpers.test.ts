/**
 * Helpers that two or more lib test files share.
 *
 * Named `.test.ts` on purpose: `deno test` loads it and runs 0 tests,
 * `lib/load-order.test.ts` skips it, and the coverage and publish
 * exclusions treat it as test code.
 */
import {
  type EvaluationInput,
  EvaluationScope,
  Frame,
  FrameCount,
  FrameExpr,
  FrameSymbol,
} from "./frames.ts";
import type { DispatchEvent } from "./frames/event-dispatch.ts";
import { constructDenum } from "./execute/denum-prologue.ts";
import { evaluate } from "./execute/evaluate.ts";

/** Counts calls; host bindings are copied, so the count is shared. */
export class Counter extends Frame {
  public readonly effects = { calls: 0 };
  public get calls(): number {
    return this.effects.calls;
  }
  public override call(_argument: Frame): Frame {
    return Frame.count(BigInt(++this.effects.calls));
  }
}

/** Counts its evaluations and answers the same frame each time. */
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

/** Reads a name as a statement would, so the answer is a handle. */
export const readName = (scope: Frame, key: string): Frame =>
  FrameSymbol.for(key).in(EvaluationScope.root(scope));

/** A dispatch event whose target is `key` read in `scope`. */
export const dispatchEvent = (
  scope: Frame,
  label: string,
  key: string,
  argument?: Frame,
): DispatchEvent => ({ label, target: readName(scope, key), argument });

/** A Count frame for `n`. */
export const countOf = (n: bigint): FrameCount => new FrameCount(n);

/** A genuine Denum with Count `count` and the given loads. */
export const denumOf = (count: bigint, loads: readonly bigint[]): Frame =>
  constructDenum(countOf(count), loads.map(countOf));

/** The answer of the last statement in a source sequence. */
export const lastTermOfLast = (source: string): Frame =>
  evaluate(source).at(-1).asArray().at(-1)!;

/** The answered value of the last statement, as a referent. */
export const answerOfLast = (source: string): Frame =>
  FrameExpr.answeredValue(evaluate(source).at(-1)).referent();

/** The last statement's value, looking through top-level groups. */
export const innermostAnswer = (
  source: string,
  meta: Record<string, Frame> = {},
): Frame => {
  let value: Frame = evaluate(source, meta).asArray().at(-1) ?? Frame.nil;
  while (
    value.constructor === FrameExpr || value.constructor.name === "FrameGroup"
  ) {
    value = value.asArray().at(-1) ?? Frame.nil;
  }
  return value.referent();
};

/** The text of the last value an evaluation answered. */
export const lastText = (source: string): string => {
  const results = evaluate(source).asArray();
  return results[results.length - 1].toString();
};

/** The text of the last term of the first statement's answer. */
export const firstEntryLastText = (source: string): string | undefined =>
  evaluate(source).at(0).asArray().at(-1)?.toString();

/** The answer of the last line; earlier lines are setup statements. */
export const lastResult = (...lines: string[]): Frame =>
  evaluate(lines.join("\n")).at(-1);

/** The text of `lastResult`. */
export const lastResultText = (...lines: string[]): string =>
  evaluate(lines.join("\n")).at(-1).toString();
