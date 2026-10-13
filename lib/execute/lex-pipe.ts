import {
  Frame,
  FrameInt,
  FrameOperator,
  FrameSchema,
  FrameString,
  FrameSymbol,
  type IArrayConstructor,
} from "../frames.ts";
import type { ScanResponse } from "../scan.ts";
import { Token } from "./lex.ts";
import type { ParsePipe } from "./parse-pipe.ts";
import { sigilizer } from "./sigilizer.ts";
import { getSyntax } from "./syntax.ts";
import type { IAction, IFinish, IPerformer } from "./terminals.ts";

function ensure_factory(factory: IArrayConstructor | Frame): IArrayConstructor {
  if (factory instanceof Frame) {
    throw new Error(
      `Expected IArrayConstructor, but received Frame: '${factory}'`,
    );
  }
  return factory;
}

export class LexPipe extends Frame implements IFinish, IPerformer {
  public level: number;
  private angleLookahead: "<" | "<-" | undefined;

  constructor(out: Frame) {
    const syntax = getSyntax();
    syntax[Frame.kOUT] = out;
    super(syntax);
    this.level = 0;
  }

  public lex_string(input: string): Frame {
    const source = new FrameString(input);
    return this.lex(source);
  }

  public lex(source: FrameString): Frame {
    return source.scanInto(this);
  }

  public override scan(argument: Frame): ScanResponse {
    const pending = this.angleLookahead;
    if (pending === undefined) return super.scan(argument);

    const symbol = argument.toString();
    if (pending === "<") {
      if (symbol === "-") {
        this.angleLookahead = "<-";
        return this;
      }

      this.angleLookahead = undefined;
      const pushed = this.perform({ push: FrameSchema });
      return pushed === this ? super.scan(argument) : pushed;
    }

    this.angleLookahead = undefined;
    if (FrameInt.NUMBER_CHAR.test(symbol)) {
      const pushed = this.perform({ push: FrameSchema });
      if (pushed !== this) return pushed;
      const withMinus = sigilizer.scan(this, FrameSymbol.for("-"));
      return sigilizer.scan(withMinus, argument);
    }

    this.emitImportArrow();
    return super.scan(argument);
  }

  public finish(_parameter: Frame): Frame {
    const pending = this.angleLookahead;
    this.angleLookahead = undefined;
    if (pending === "<") {
      const pushed = this.perform({ push: FrameSchema });
      if (pushed !== this) return pushed;
    } else if (pending === "<-") {
      this.emitImportArrow();
    }

    const parser = this.get(Frame.kOUT) as ParsePipe;
    if (parser.strictStructure && this.level !== 0) {
      return this.structureFailure("unclosed", `${this.level}`);
    }

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

  public perform(action: IAction): Frame {
    for (const [key, value] of Object.entries(action)) {
      if (key === "angle") {
        this.angleLookahead = "<";
        continue;
      }

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
          if (parser.strictStructure && this.level !== 0) {
            return this.structureFailure("unclosed", `${this.level}`);
          }
          if (value instanceof Frame) {
            parser.finish(value);
          } else {
            console.error(
              `LexPipe.perform.end.failed: value ${value} is not a Frame`,
            );
          }
          break;
        }
        case "bind": {
          parser = parser.bind();
          this.set(Frame.kOUT, parser);
          break;
        }
        case "push": {
          const factory = ensure_factory(value);
          parser = parser.push(factory);
          this.set(Frame.kOUT, parser);
          this.level += 1;
          break;
        }
        case "pop": {
          const factory = ensure_factory(value);
          if (this.level === 0) {
            if (parser.strictStructure) {
              return this.structureFailure("unmatched", factory.name);
            }
            console.error("LexPipe.perform.pop.failed: already at top level");
            break;
          }
          if (!parser.canPop(factory)) {
            if (parser.strictStructure) {
              return this.structureFailure(
                "mismatched",
                `${factory.name} ${parser.factoryName()}`,
              );
            }
            break;
          }
          parser = parser.pop(factory);
          this.set(Frame.kOUT, parser);
          this.level -= 1;
          break;
        }
      }
    }
    return this;
  }

  private emitImportArrow(): void {
    const parser = this.get(Frame.kOUT) as ParsePipe;
    parser.call(new Token(new FrameOperator("<-")));
  }

  private structureFailure(kind: string, detail: string): Frame {
    return Frame.error(`$!.parse-${kind}-structure ${detail}`);
  }
}
