export class Frame {
  public call(argument: Frame) {
    return argument;
  }
};

export class FrameArray {
  constructor(protected data: Array<Frame>) {
  }

  public at(index: number) {
    return this.data[index];
  }
}
