import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { Lex } from "./lex";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";
import { IAction, IFinish, IPerformer } from "./terminals";

export class LexPipe extends Frame implements IFinish, IPerformer {

  constructor(out: Frame) {
    syntax[Frame.kOUT] = out;
    super(syntax);
    this.addPipeToLex();
  }

  public addPipeToLex() {
    Object.values(syntax).forEach((value) => {
      if (value instanceof Lex) {
        const lex = value as Lex;
        lex.pipe = this;
      }
    });
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public finish(_parameter: Frame) {
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    const result = out.call(output);
    return this;
  }

  public perform(actions: IAction) {
    const parser = this.get(Frame.kOUT) as ParsePipe;
    _.forEach(actions, (value, key) => {
      switch (key) {
        case "semi-next": {
          parser.next(true);
          break;
        }
        case "next": {
          parser.next(false);
          break;
        }
        case "end": {
          parser.finish(value);
          break;
        }
        case "push": {
          const next_parser = parser.push(value);
          this.set(Frame.kOUT, next_parser);
          break;
        }
        case "pop": {
          const next_parser = parser.pop(value);
          this.set(Frame.kOUT, next_parser);
          break;
        }
      }
    });
    return this;
  }

}
