import { Frame } from "./frame.ts";
import { type Context, NilContext } from "./context.ts";

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
      return obj.toString() + sep;
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

  public override asArray(): Array<Frame> {
    return this.data;
  }

  public size(): number {
    return this.data.length;
  }

  protected array_eval(contexts: Array<Frame>): Array<Frame> {
    contexts.push(this);
    return this.data.map((f: Frame) => f.in(contexts));
  }
}
