import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";
import { IAction, IPerformer } from "./terminals";

export class LexPipe extends Frame implements IPerformer {
  constructor(out: Frame) {
    syntax[Frame.kOUT] = out;
    super(syntax);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public finish(parameter: Frame) {
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  public perform(actions: IAction) {
    const parser = this.get(Frame.kOUT) as ParsePipe;
    _.forEach(actions, (value, key) => {
      switch (key) {
        case "next": {
          const header = (value === ";") ? true : false;
          parser.next(header);
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
