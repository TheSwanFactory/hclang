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

  private scoped(input: EvaluationInput): EvaluationScope {
    const scope = EvaluationScope.from(input).withLayer(this);
    return this.declares ? scope.withWriteTarget(this, "construction") : scope;
  }

  public eval_one(input: EvaluationInput = []): Frame {
    const scope = this.scoped(input);
    const expr = this.data[0];
    const result = expr.in(scope);

    const symbols = this.meta_pairs();
    symbols.forEach(([key, value]) => {
      result.set(key, value);
    });
    return result;
  }

  public override in(input: EvaluationInput = []): Frame {
    switch (this.size()) {
      case 0: {
        return Frame.nil;
      }
      case 1: {
        return this.eval_one(input);
      }
    }
    const scope = this.scoped(input);
    this.data = this.data.map((frame: Frame) => frame.in(scope));
    return this;
  }
}
