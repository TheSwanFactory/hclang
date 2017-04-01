import { Frame, FrameGroup } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { Terminal } from "./terminals";

export class GroupPipe extends ParsePipe {
  constructor(out: Frame) {
    super(out);
  }

  protected makeFrame() {
    const current = this.asArray();
    return new FrameGroup(current);
  }
}
