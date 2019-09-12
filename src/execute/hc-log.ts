import { Context, Frame } from "../frames";

export type Counts = { [key: string]: number; };

export class HCLog extends Frame {

  constructor(context: Context) {
    super(context);
  }

  public apply(argument: Frame, _parameter = Frame.nil): Frame {
    const debug = this.get("DEBUG");
    if (debug !== Frame.missing) {
      console.log(argument.id, argument);
    }
    if (argument !== Frame.nil && !argument.is.void && !argument.is.statement) {
      console.log(argument.toString());
    }
    return argument;
  }
}
