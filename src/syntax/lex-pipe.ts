import { Context, Frame, FrameArray, FrameLazy, FrameString, FrameSymbol, Void } from "../frames";
import { tokens } from "./tokens";

export class LexPipe extends Frame {
  constructor(out: Frame) {
    tokens[Frame.kOUT] = out;
    super(tokens);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }
}
