import chalk from "chalk";
import { Context, Frame } from "../frames";
import { HCEval } from "./hc-eval";

export type Counts = { [key: string]: number; };

export class HCLog extends Frame {

  constructor(context: Context, public prompt: boolean = false) {
    super(context);
  }

  public apply(argument: Frame, _parameter = Frame.nil): Frame {
    const debug = this.get("DEBUG");
    if (debug !== Frame.missing) {
      console.log(argument.id, argument);
    }
    if (argument !== Frame.nil && !argument.is.void && !argument.is.statement) {
      const output = argument.toString();
      if (this.prompt) {
        console.log(HCEval.EXPECT + output);
      } else {
        console.log(output);
      }
    }
    return argument;
  }
}
