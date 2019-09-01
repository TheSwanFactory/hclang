import { Frame } from "./frame";
import { FrameArray } from "./frame-array";
import { Context, NilContext } from "./meta-frame";

export interface IArrayConstructor {
    new (data: Array<Frame>, meta: Context): Frame;
}

export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta = NilContext) {
    super(meta);
  }

  public string_open() { return "("; };
  public string_close() { return ")"; };

  public toStringDataArray() {
    return this.data.map( (obj: Frame) => obj.toString() );
  };

  public toStringArray(): string[] {
    const result = this.toStringDataArray();
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
    }
    return result;
  }

  public toString() {
    return this.string_open() + this.toStringArray().join(", ") + this.string_close();
  }

  public asArray(): Array<Frame> {
    return this.data;
  }

  public size() {
    return this.data.length;
  }

  protected array_eval(contexts: Array<Frame>): Frame {
    contexts.push(this);
    return new FrameArray(this.data.map( (f: Frame) => f.in(contexts) ));
  }
}
