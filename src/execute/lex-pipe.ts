import * as _ from "lodash";
import { Context, Frame, FrameString, FrameSymbol } from "../frames";
import { ParsePipe } from "./parse-pipe";
import { syntax } from "./syntax";

export class LexPipe extends Frame {
  constructor(out: Frame) {
    syntax[LexPipe.kOUT] = out;
    // console.error(` * LexPipe.meta ${JSON.stringify(meta, null, 2)}\n`);
    super(syntax);
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public finish(argument: Frame) {
    const output = FrameSymbol.end();
    const out = this.get(Frame.kOUT);
    return out.call(output);
  }

  public perform(actions: Context) {
    const parser = this.get(LexPipe.kOUT) as ParsePipe;
    _.forEach(actions, (value, key) => {
      // console.log("  *  perform.key " + key);
      switch (key) {
        case "next": {
          this.finish(value);
          break;
        }
        case "push": {
          const next_parser = parser.push(value);
          this.set(LexPipe.kOUT, next_parser);
          break;
        }
        case "pop": {
          const next_parser = parser.pop(value);
          this.set(LexPipe.kOUT, next_parser);
          break;
        }
      }
    });
    return this;
  }

}
