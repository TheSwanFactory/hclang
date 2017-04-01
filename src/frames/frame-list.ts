import { Frame, Void } from "./frame";

export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta = Void) {
    super(meta);
  }

  public toStringDataArray() {
    return this.data.map( (obj: Frame) => obj.toString() );
  };

  public toStringArray(): string[] {
    const result = this.toStringDataArray();
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
    }
    return result;
  }

  public toString() {
    return this.string_open() + this.toStringArray().join(", ") + this.string_close();
  }

  public asArray(): Array<Frame> {
    return this.data;
  }
}
