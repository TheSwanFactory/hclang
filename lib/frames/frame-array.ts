import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { FrameNote } from "./frame-note.ts";
import type { MetaFrame } from "./meta-frame.ts";
import { NilContext } from "./context.ts";
import type { EvaluationInput } from "./evaluation-scope.ts";
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

  public override in(input: EvaluationInput = []): Frame {
    const result = new FrameArray([...this.data], this.meta_copy());
    // A declared parent is carried in its own field, so propagation is a copy
    // of that field rather than a flag dance over the lexical pointer.
    if (this.hasDeclaredParent()) {
      result.parent = this.parent;
    }
    // An aggregate accepts declarations while it is under construction, and
    // says so rather than leaving a name to infer it from the context stack.
    // The mark is scoped to that construction: once built, the aggregate is a
    // value, so appearing in a later context stack (as a method receiver, say)
    // does not make it absorb declarations.
    result.declares = true;
    try {
      result.data = this.array_eval(input, result);
    } finally {
      result.declares = false;
    }
    return result;
  }

  /**
   * Aggregates are where identity matters, so an instance copy isolates them:
   * every nested aggregate, in the data plane and the metadata plane alike, gets
   * fresh identity, and writing through the copy is invisible through the
   * original at any depth. Atoms and closure bodies are shared, since neither
   * carries identity a write can land on. A declared parent rides along in its
   * own field, and the id is always fresh.
   */
  public override instanceCopy(seen: Map<Frame, Frame> = new Map()): Frame {
    const copied = seen.get(this);
    if (copied) {
      return copied;
    }
    const clone = this.copy();
    seen.set(this, clone);
    clone.data = this.data.map((item) => item.instanceCopy(seen));
    for (const [key, value] of this.meta_pairs()) {
      clone.set(key, value.instanceCopy(seen));
    }
    return clone;
  }

  protected override lookup_here(key: string, origin: MetaFrame): Frame {
    if (/^\d+$/.test(key)) {
      return this.at(Number(key));
    }
    return super.lookup_here(key, origin);
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
