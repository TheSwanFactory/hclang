import * as _ from "lodash";
import { Context, Frame, FrameGroup, FrameString, NilContext } from "../frames";
import { ICurryFunction } from "../ops";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";

export class LexOptions extends Frame {
  constructor(protected flags: any) {
    super(NilContext);
  }
}

class LexTerminal extends Frame {
  constructor(protected options: LexOptions) {
    super(NilContext);
    this.callme = true;
  }

  public apply(argument: Frame, parameter: Frame) {
    const source = argument as Lexer;
    const options = parameter as LexOptions;
    return source.terminate(options);
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

  public terminate(options: LexOptions) {
    return Frame.nil;
  }
}

const parameter = new LexOptions({
  isStatement: true,
  pop: true,
  push: FrameGroup,
});
