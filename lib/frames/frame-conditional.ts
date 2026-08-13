import { Frame } from "./frame.ts";
import type { MetaFrame } from "./meta-frame.ts";

/**
 * Preserves a successful `?` result until a following `:` has been reduced.
 * For every other operation it behaves like the selected branch value.
 */
export class FrameConditional extends Frame {
  constructor(private readonly selected: Frame) {
    super();
    this.is.conditional = true;
  }

  public otherwise(_block: Frame): Frame {
    return this.selected;
  }

  public override get(key: string, origin: MetaFrame = this): Frame {
    if (key === ":") {
      return super.get(key, origin);
    }
    return this.selected.get(key, this.selected);
  }

  public override apply(argument: Frame, parameter: Frame): Frame {
    return this.selected.apply(argument, parameter);
  }

  public override toString(): string {
    return this.selected.toString();
  }
}
