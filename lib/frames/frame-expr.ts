import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { NilContext } from "./context.ts";

/**
 * Represents a Frame Expression that extends FrameList.
 *
 * @extends FrameList
 */
export class FrameExpr extends FrameList {
  /**
   * Constructs a new FrameExpr instance.
   *
   * @param data - An array of Frame objects.
   * @param meta - Metadata context, defaults to NilContext.
   */
  constructor(data: Array<Frame>, meta = NilContext) {
    super(data, meta);
    data.forEach((item) => {
      item.up = this;
    });
  }

  /**
   * Overrides the `in` method to process the frame within given contexts.
   *
   * @param contexts - An array of Frame contexts, defaults to [Frame.nil].
   * @returns The resulting Frame after processing.
   */
  public override in(contexts = [Frame.nil]): Frame {
    contexts.push(this);
    const result = this.data.reduce((sum: Frame, item: Frame): Frame => {
      const value = item.in(contexts);
      const next_sum = sum.call(value);
      return next_sum;
    }, Frame.nil);

    if (this.is.statement) {
      this.data = [result];
      return this;
    }
    return result;
  }

  /**
   * Overrides the `call` method to invoke the frame with an argument and parameter.
   *
   * @param argument - The argument Frame.
   * @param parameter - The parameter Frame, defaults to Frame.nil.
   * @returns The resulting Frame after invocation.
   */
  public override call(argument: Frame, parameter = Frame.nil): Frame {
    return this.in([argument, parameter]);
  }

  /**
   * Converts the data array to a string array representation.
   *
   * @returns An array of strings representing the data.
   */
  public override toStringDataArray(): string[] {
    const array = this.data.map((obj: Frame): string => obj.toString());
    return [array.join(" ") + ","];
  }
}

/**
 * A subclass used to bind expressions during parsing.
 *
 * @extends FrameExpr
 */
export class FrameBind extends FrameExpr {
}
