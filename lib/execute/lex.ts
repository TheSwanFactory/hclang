/**
 * Generic monadic parser for HC atoms.
 *
 * `syntax.ts` configures one `Lex` with each registered syntax descriptor.
 * After a source character selects that lexer through the `LexPipe` context,
 * `Lex` folds subsequent characters into the atom, emits a `Token` containing
 * the completed frame, and returns control to its parent pipe. `ParsePipe` then
 * aggregates the frame without interpreting its lexical syntax.
 *
 * Recognition belongs to the registered descriptor, construction to an explicit
 * value factory. `Lex` never builds a value in order to ask a question about
 * syntax: an ordinary lexeme is recognized class-side, and only a stateful
 * receiver installed by a transition is an object at all.
 *
 * Keep this reducer generic: type tests and branches that encode the syntax of
 * an individual atom undermine the data-driven dispatch established by
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
  type AtomSyntax,
  ScanDisposition,
  type ScanResponse,
  type SyntaxFacet,
} from "../scan.ts";

export type Flag = { [key: string]: boolean };

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

/**
 * Mutable lexeme state shared by every lexical mode.
 *
 * The buffer lives here, which is why a descriptor can recognize source without
 * holding any state of its own.
 */
export abstract class LexHost extends Frame implements ISourced {
  public source = "";
  protected body = "";

  protected constructor(facet: SyntaxFacet) {
    super();
    this.is.void = true;
    this.is.lexical = true;
    this.id = this.id + "." + facet.NAME;
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    return sigilizer.scan(this, argument);
  }

  public override toString(): string {
    return this.id + `[${this.body}]`;
  }

  protected lexemeSource(): string {
    return this.body === "" ? this.source : this.body;
  }

  /** Resolve the terminal result frame at the end of the active output chain. */
  protected scanContext(): Frame {
    let context = this.get(Frame.kOUT);
    const seen = new Set<Frame>();

    while (!context.is.missing && !seen.has(context)) {
      seen.add(context);
      const next = context.get_here(Frame.kOUT, context);
      if (next.is.missing) {
        break;
      }
      context = next;
    }

    return context;
  }
}

export class Lex extends LexHost {
  /** A stateful receiver installed by a transition, or none. */
  private active: Frame | null = null;

  public constructor(protected syntax: AtomSyntax) {
    super(syntax);
  }

  public override scan(argument: Frame, _source = ""): ScanResponse {
    const source = this.lexemeSource();
    const context = this.scanContext();
    return this.active === null
      ? this.syntax.recognize(argument, source, context)
      : this.active.scan(argument, source, context);
  }

  public override finishInput(): ScanResponse {
    const source = this.lexemeSource();
    return this.active === null
      ? this.syntax.finish(source)
      : this.active.finishInput(source);
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
    this.active = next;
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

  /**
   * Emits one completed value and resets recognition.
   *
   * Resetting is discarding the active receiver: a stateless recognizer has
   * nothing to rebuild.
   */
  protected makeFrame(value: Frame | null = null): Token {
    this.active = null;
    if (value !== null) {
      this.body = "";
      return new Token(value);
    }
    if (this.body === "") {
      this.body = this.source;
    }
    const frame = this.syntax.fromSource(this.body);
    this.body = "";
    return new Token(frame);
  }

  private append(argument: Frame): void {
    if (this.body === "") {
      this.body = this.source;
    }
    this.body += argument.toString();
  }
}
