import { Frame, FrameGroup } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { Terminal } from "./terminals";

export class GroupPipe extends ParsePipe {
  constructor(out: Frame) {
    super(out);
    this.factory = FrameGroup;
  }
}
