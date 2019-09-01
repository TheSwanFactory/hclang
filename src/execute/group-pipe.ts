import { Frame, FrameGroup, FrameSymbol } from "../frames";
import { ParsePipe } from "./parse-pipe";

export class GroupPipe extends ParsePipe {
  constructor(out: Frame, factory: any) {
    super(out, factory);
  }

  public call(argument: Frame, parameter = Frame.nil) {
    if (argument === FrameSymbol.end()) {
      return this.finish(argument);
    }
    return super.call(argument, parameter);
  };

}
