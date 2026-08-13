import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import type { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import type { SigilStart } from "../scan.ts";

export class FrameArray extends FrameList {
  public static readonly BEGIN_ARRAY = "[";
  public static readonly END_ARRAY = "]";
  public static readonly SIGIL_STARTS = [
    { key: FrameArray.BEGIN_ARRAY, mode: "push" },
    { key: FrameArray.END_ARRAY, mode: "pop" },
  ] as const satisfies readonly SigilStart[];

  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
  }

  public override string_open(): string {
    return FrameArray.BEGIN_ARRAY;
  }

  public override string_close(): string {
    return FrameArray.END_ARRAY;
  }

  public override in(contexts: Array<Frame> = [Frame.nil]): Frame {
    const array = this.array_eval(contexts);
    const result = new FrameArray(array, this.meta_copy());
    if (this.is.inherited === true) {
      result.up = this.up;
      result.is.inherited = true;
    }
    return result;
  }

  public override get(key: string, origin: MetaFrame = this): Frame {
    if (!isNaN(Number(key))) {
      return this.at(Number(key));
    }
    return super.get(key, origin);
  }

  public override apply(argument: Frame, _parameter: Frame): FrameArray {
    if (!argument.is.void) {
      this.data.push(argument);
    }
    return this;
  }

  public override at(index: number): Frame {
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

  public length(): number {
    return this.data.length;
  }

  public reset(): void {
    this.data = [];
  }
}
