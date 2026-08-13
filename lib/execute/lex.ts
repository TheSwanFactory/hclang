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
  type ISourced,
  NilContext,
} from "../frames.ts";
import { sigilizer } from "./sigilizer.ts";
import {
  ScanDisposition,
  type ScanResponse,
  type SigilStart,
} from "../scan.ts";

export type Flag = { [key: string]: boolean };

export interface AtomFactory {
  new (body: string): FrameAtom;
  readonly SIGIL_STARTS: readonly SigilStart[];
}
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
    return sigilizer.scan(this, argument);
  }

  public override scan(argument: Frame, _source = ""): ScanResponse {
    return this.sample.scan(argument, this.lexemeSource());
  }

  public override toString(): string {
    return this.id + `[${this.body}]`;
  }

  public override finishInput(): ScanResponse {
    return this.sample.finishInput(this.lexemeSource());
  }

  public consumeScan(argument: Frame): Frame {
    this.append(argument);
    return this;
  }

  public completeScan(value: Frame | null = null): Frame {
    this.exportFrame(value);
    return this.up;
  }

  public transitionScan(next: Frame): ScanResponse {
    if (!(next instanceof FrameAtom)) {
      return {
        disposition: ScanDisposition.Error,
        message: "lexical transition did not return an atom",
      };
    }
    this.sample = next;
    this.body = "";
    this.source = "";
    return this;
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
