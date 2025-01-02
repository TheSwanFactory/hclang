import { Frame, FrameString, FrameSymbol } from "../frames.ts";
import { ParsePipe } from "./parse-pipe.ts";
import { getSyntax } from "./syntax.ts";
import { IAction, IFinish, IPerformer } from "./terminals.ts";

export class LexPipe extends Frame implements IFinish, IPerformer {
  public level: number;

  constructor(out: Frame) {
    const syntax = getSyntax();
    syntax[Frame.kOUT] = out;
    super(syntax);
    this.level = 0;
  }

  public lex_string(input: string) {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString) {
    return source.reduce(this);
  }

  public finish(_parameter: Frame): LexPipe {
    const next_parser = this.unbind();
    const output = FrameSymbol.end();
    next_parser.call(output);
    return this;
  }

  public unbind(skip = false): ParsePipe {
    let next_parser = this.get(Frame.kOUT) as ParsePipe;
    if (!skip) {
      next_parser = next_parser.unbind();
    }
    return next_parser;
  }

  public perform(action: IAction) {
    for (const [key, value] of Object.entries(action)) {
      const skip = key === "push";
      let parser = this.unbind(skip);
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
        case "bind": {
          parser = parser.bind();
          this.set(Frame.kOUT, parser);
          break;
        }
        case "push": {
          parser = parser.push(value);
          this.set(Frame.kOUT, parser);
          this.level += 1;
          break;
        }
        case "pop": {
          if (this.level === 0) {
            console.error("LexPipe.perform.pop.failed: already at top level");
            break;
          }
          if (!parser.canPop(value)) {
            break;
          }
          parser = parser.pop(value);
          this.set(Frame.kOUT, parser);
          this.level -= 1;
          break;
        }
      }
    }
    return this;
  }
}
