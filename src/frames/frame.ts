export class Frame {
  public call(argument: Frame) {
    return argument;
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
