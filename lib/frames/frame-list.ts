import { Frame } from "./frame.ts";
import { type Context, NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { renderNested } from "./stringify.ts";

/**
 * The `IArrayConstructor` interface defines a constructor for creating
 * `Frame` objects from an array of `Frame` objects and a `Context`.
 */
export interface IArrayConstructor {
  new (data: Array<Frame>, meta: Context): Frame;
}

const stripLastComma = (result: Array<string>): Array<string> => {
  if (!result || result.length < 1) {
    return result;
  }
  const n = result.length - 1;
  const last = result[n];
  const n_last = last.length - 1;
  if (last[n_last] === ",") {
    result[n] = last.substring(0, n_last);
  }
  return result;
};

export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta: Context = NilContext) {
    super(meta);
  }

  public override string_open(): string {
    return Frame.BEGIN_EXPR;
  }

  public override string_close(): string {
    return Frame.END_EXPR;
  }

  public toStringDataArray(): Array<string> {
    const result = this.data.map((obj: Frame) => {
      const sep = (obj.is.statement) ? ";" : ",";
      return renderNested(obj, () => obj.toString()) + sep;
    });
    return result;
  }

  public toStringArray(): string[] {
    const result = this.toStringDataArray();
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
      return result;
    }
    return stripLastComma(result);
  }

  public isEmpty(): boolean {
    return (this.data.length === 0);
  }

  public override toString(): string {
    return this.string_open() + this.toStringArray().join(" ") +
      this.string_close();
  }

  public override dataString(): string {
    // Evaluated property declarations are retained as data-plane assignment
    // echoes as well as metadata. Exclude those echoes from data-only equality.
    const metadataAssignments = new Set(
      this.meta_pairs().map(([key, value]) => `.${key} ${value}`),
    );
    const data = this.data.filter((item) =>
      !metadataAssignments.has(renderNested(item, () => item.toString()))
    );
    return this.string_open() +
      data.map((item) => renderNested(item, () => item.dataString())).join(
        ",",
      ) +
      this.string_close();
  }

  public override asArray(): Array<Frame> {
    return this.data;
  }

  public size(): number {
    return this.data.length;
  }

  public override copy(): this {
    const clone = super.copy();
    clone.data = [...this.data];
    return clone;
  }

  /** Evaluate source items with an explicit innermost declaration target. */
  protected array_eval(
    input: EvaluationInput,
    out: Frame = this,
  ): Array<Frame> {
    const scope = EvaluationScope.from(input).withWriteTarget(
      out,
      "construction",
    );
    return this.data.map((frame) => frame.in(scope));
  }
}
