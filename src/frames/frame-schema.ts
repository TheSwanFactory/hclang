import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import { NilContext } from "./meta-frame.ts";

export class FrameSchema extends FrameList {
  public static readonly BEGIN_SCHEMA = "<";
  public static readonly END_SCHEMA = ">";

  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  public override string_open() {
    return FrameSchema.BEGIN_SCHEMA;
  }

  public override string_close() {
    return FrameSchema.END_SCHEMA;
  }

  public override in(contexts = [Frame.nil]): Frame {
    const array = this.array_eval(contexts);
    return new FrameSchema(array);
  }

  public override apply(argument: Frame, _parameter: Frame) {
    if (!argument.is.void) {
      this.data.push(argument);
    }
    return this;
  }

  public override at(index: number) {
    if (index >= this.size() || -index > this.size()) {
      const source = "[0.." + this.size() + "]." + index;
      return FrameNote.index(source);
    }
    if (index >= 0) {
      return this.data[index];
    }
    const n = this.data.length;
    return this.data[n + index];
  }

  public length() {
    return this.data.length;
  }

  public reset() {
    this.data = [];
  }
}
