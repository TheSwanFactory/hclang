/**
 * Generic monadic parser for HC atoms.
 *
 * `syntax.ts` configures one `Lex` with each registered atom factory. After a
 * source character selects that lexer through the `LexPipe` context, `Lex`
 * folds subsequent characters into the atom, emits a `Token` containing the
 * completed frame, and returns control to its parent pipe. `ParsePipe` then
 * aggregates the frame without interpreting its lexical syntax.
 *
 * Atom-specific recognition belongs behind the atom lexical contract. Keep
 * this reducer generic: type tests and branches that encode the syntax of an
 * individual atom undermine the data-driven dispatch established by
 * `getSyntax()`.
 *
 * @module
 */
import {
  type Any,
  Frame,
  FrameAtom,
  FrameSymbol,
  type ISourced,
  LexicalScan,
  NilContext,
} from "../frames.ts";

export type Flag = { [key: string]: boolean };

export type AtomFactory = new (body: string) => FrameAtom;
export class Token extends FrameAtom {
  constructor(protected data: Frame) {
    super(NilContext);
  }

  public override called_by(callee: Frame, parameter: Frame): Frame {
    return callee.apply(this.data, parameter);
  }

  protected override toData(): Any {
    return this.data;
  }

  public override inspect(): string {
    return `Token[${this.data.inspect()}]`;
  }
}

export class Lex extends Frame implements ISourced {
  public source: string;
  protected body: string = "";
  protected sample: FrameAtom;

  public constructor(protected Factory: AtomFactory) {
    super();
    this.sample = new Factory("");
    this.source = "";
    this.is.void = true;
    this.is.lexical = true;
    const name = this.sample.className();
    this.id = this.id + "." + name;
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    return this.scan(argument);
  }

  public override scan(argument: Frame, _source = ""): Frame {
    const transition = this.sample.scan(argument, this.lexemeSource());
    if (!(transition instanceof LexicalScan)) {
      return transition;
    }

    switch (transition.disposition) {
      case "consume":
        this.append(argument);
        return this;
      case "complete-consume":
        return this.finish(argument, false, transition.value);
      case "complete-redispatch":
        return this.finish(argument, true, transition.value);
      case "transition":
        if (transition.next instanceof FrameAtom) {
          this.sample = transition.next;
          this.body = "";
          this.source = "";
          return this;
        }
        return LexicalScan.error("lexical transition did not return an atom");
      case "error":
        return transition;
    }
  }

  public override toString(): string {
    return this.id + `[${this.body}]`;
  }

  public override finishInput(): Frame {
    const readiness = this.sample.finishInput(this.lexemeSource());
    if (readiness.is.error) {
      return readiness;
    }
    return this.scan(FrameSymbol.end());
  }

  protected finish(
    argument: Frame,
    passAlong: boolean,
    value: Frame | null = null,
  ): Frame {
    this.exportFrame(value);
    if (passAlong) {
      const result = this.up.call(argument);
      return result;
    }
    return this.up;
  }

  protected exportFrame(value: Frame | null = null): Frame {
    const output: Token = this.makeFrame(value);
    const out = this.get(Frame.kOUT);
    const result = out.call(output);
    return result;
  }

  protected makeFrame(value: Frame | null = null): Token {
    if (value !== null) {
      this.body = "";
      this.sample = new this.Factory("");
      return new Token(value);
    }
    if (this.body === "") {
      this.body = this.source;
    }
    const frame = new this.Factory(this.body);
    this.body = "";
    return new Token(frame);
  }

  private append(argument: Frame): void {
    if (this.body === "") {
      this.body = this.source;
    }
    this.body += argument.toString();
  }

  private lexemeSource(): string {
    return this.body === "" ? this.source : this.body;
  }
}
