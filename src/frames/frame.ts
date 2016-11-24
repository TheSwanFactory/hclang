type Context = { [key: string]: Frame; };
const Void: Context = {};

export class Frame {
  public static readonly BEGIN = "(";
  public static readonly END = ")";

  public static readonly nil = new Frame();

  constructor(protected meta = Void) {
  }

  public in(context = Frame.nil) {
    return this;
  }

  public call(argument: Frame) {
    return argument;
  }

  public toString() {
    return Frame.BEGIN + Frame.END;
  }
};

export class FrameArray extends Frame {
  constructor(protected data: Array<Frame>, meta = Void) {
    super(meta);
  }

  public at(index: number) {
    return this.data[index];
  }
}
