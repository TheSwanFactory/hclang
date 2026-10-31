import { FrameExpr } from "./frame-expr.ts";
import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import type { SigilStart } from "../scan.ts";

export class FrameGroup extends FrameList {
  public static readonly SIGIL_STARTS = [
    { key: Frame.BEGIN_EXPR, mode: "push" },
    { key: Frame.END_EXPR, mode: "pop" },
  ] as const satisfies readonly SigilStart[];
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  protected override supportsResidual(): boolean {
    return true;
  }

  /**
   * The scope this group's terms are evaluated in. `target` is the layer they
   * read the group's properties from and, for a group written in source, the
   * frame their declarations land on.
   */
  private scoped(input: EvaluationInput, target: Frame): EvaluationScope {
    const scope = EvaluationScope.from(input).withOwnLayer(target);
    return this.declares
      ? scope.withWriteTarget(target, "construction")
      : scope;
  }

  /**
   * A group of one answers its term, carrying the group's properties. They
   * are collected on a fresh copy, so one evaluation's declarations reach its
   * own answer and never a later evaluation of the same group (#404).
   */
  public eval_one(input: EvaluationInput = []): Frame {
    const target = this.copy();
    target.is.source = false;
    const result = this.data[0].in(this.scoped(input, target));

    target.meta_pairs().forEach(([key, value]) => {
      result.set(key, value);
    });
    return result;
  }

  /**
   * A parsed group is source, and a closure evaluates the same one on every
   * call, so the value is always a fresh group and this one is never written.
   * Evaluating in place replaced its terms with the first call's answers,
   * which every later call then answered again (#404).
   */
  public override in(input: EvaluationInput = []): Frame {
    switch (this.size()) {
      case 0: {
        return Frame.nil;
      }
      case 1: {
        return this.eval_one(input);
      }
    }
    const result = this.copy();
    result.is.source = false;
    const scope = this.scoped(input, result);
    result.data = result.data.map((frame: Frame) => frame.in(scope));
    return result;
  }

  /**
   * `()` is nil, so a repetition left with no term at all answers nil:
   * `0 (1, 2)` is `()`, as the literal is. A group that holds properties keeps
   * them, as every aggregate does, so `0 (.k 1; 4, 5)` holds `.k` alone.
   */
  protected override finishRepetition(): Frame {
    return this.size() === 0 ? Frame.nil : this;
  }
}

/**
 * A comma expression in a closure body is a group that declares nothing of
 * its own, as the parser's top-level wrapper is, so its declarations land in
 * the call's frame (#443).
 */
FrameExpr.commaGroup = (terms, scope) =>
  new FrameGroup([...terms], {}).in(scope);
