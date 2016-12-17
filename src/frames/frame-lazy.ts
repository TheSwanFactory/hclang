import { Context, Frame, Void } from "./frame";
import { FrameExpr } from "./frame-expr";

export class FrameLazy extends FrameExpr {
  public static readonly LAZY_BEGIN = "{";
  public static readonly LAZY_END = "}";

  constructor(data: Array<Frame>, meta: Context = Void) {
    super(data, meta);
  }

  public string_open() { return FrameLazy.LAZY_BEGIN + " "; };
  public string_close() { return  " " + FrameLazy.LAZY_END; };

  public in(context: Frame): Frame {
    if (this.data.length === 0) {
      return this;
    }
    let MetaNew = this.meta_copy();
    for (let attr in context) {
      if (context.hasOwnProperty(attr)) {
        let prop: any = (<any> context)[attr];
        MetaNew[attr] = prop;
      }
    }
    return new FrameExpr(this.data, MetaNew);
  }

  public call(argument: Frame): FrameExpr {
    return new FrameExpr(argument.toArray(), {up: this});
  }
};
