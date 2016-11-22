export class Frame {
  public static readonly BEGIN = "(";
  public static readonly END = ")";

  public call(argument: Frame) {
    return argument;
  }
  public toString() {
    return Frame.BEGIN + Frame.END;
  }
};

export class FrameArray extends Frame {
  constructor(protected data: Array<Frame>) {
    super();
  }

  public at(index: number) {
    return this.data[index];
  }

}
