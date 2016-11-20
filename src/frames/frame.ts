export class Frame {

};

export class FrameArray {
  constructor(protected data: Array<Frame>) {
  }

  public at(index: number) {
    return this.data[index];
  }
}
