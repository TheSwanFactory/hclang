import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol, NilContext } from "../frames";
import { ICurryFunction } from "../ops";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";

class LexTerminal extends Frame {
  constructor(protected options: Frame) {
    super(NilContext);
    this.callme = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    const source = argument as Lexer;
    return source.terminate(this.options);
  }
}

export class Lexer extends Frame {
  constructor(out: Frame) {
    syntax[Lexer.kOUT] = out;
    super(syntax);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public fold(argument: Frame) {
    const out = this.get(Frame.kOUT);
    this.set(Frame.kOUT, out.call(argument));
  }

  public terminate(parameter: Frame) {
    return Frame.nil;
  }
}
