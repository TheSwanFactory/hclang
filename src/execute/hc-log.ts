import chalk from "jsr:@nothing628/chalk";
import { type Context, Frame } from "../frames.ts";
import { HCEval } from "./hc-eval.ts";

export type Counts = { [key: string]: number };

export class HCLog extends Frame {
  constructor(context: Context, public prompt: boolean = false) {
    super(context);
  }

  public override apply(argument: Frame, _parameter = Frame.nil): Frame {
    const debug = this.get("DEBUG");
    if (debug !== Frame.missing) {
      console.log(argument.id, argument);
    }
    if (argument !== Frame.nil && !argument.is.void && !argument.is.statement) {
      const output = argument.toString();
      if (this.prompt) {
        console.log(chalk.grey(HCEval.EXPECT + output));
      } else {
        const colorized = this.color(output);
        console.log(colorized);
      }
    }
    return argument;
  }

  private color(output: string): string {
    if (output[0] !== "$") {
      return output;
    }
    const flag = output[1];
    const part = output.split(" .n ");
    switch (flag) {
      case "+":
        return chalk.green(part[0]) + chalk.grey.bold(part[1]);
      case "-":
        return chalk.red(part[0]) + chalk.grey.bold(part[1]);
      default:
        return chalk.yellow(output);
    }
  }
}
