import { Frame, FrameDoc, NilContext } from "../frames.ts";
import { Lex, Token } from "./lex.ts";

/**
 * Monadic parser for document atoms selected by the backtick syntax entry.
 *
 * A physical input chunk does not terminate a pending backtick run. The run is
 * classified only when a non-backtick, a logical newline, or EOF establishes
 * its maximal length.
 */
export class LexDoc extends Lex {
  private opening = true;
  private ticks = 1;
  private fenceLength = 0;
  private failureMessage: string | null = null;

  public constructor() {
    super(FrameDoc);
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    if (this.failureMessage !== null) {
      return this;
    }

    const char = argument.toString();
    if (char === FrameDoc.DOC_END) {
      this.ticks += 1;
      if (!this.opening && this.ticks > this.fenceLength) {
        this.failureMessage = "document fence run exceeds the opening fence";
      }
      return this;
    }

    return this.classifyRun(argument, char);
  }

  /** Classifies a final pending run and reports whether EOF is valid. */
  public finishInput(): boolean {
    if (this.failureMessage !== null) {
      return false;
    }

    if (this.opening) {
      if (this.ticks % 2 === 0) {
        this.emitDocument("", this.ticks);
        this.resetDocument();
        return true;
      }
      return this.failUnterminated();
    }

    if (this.ticks === this.fenceLength) {
      this.emitDocument(this.body, this.fenceLength);
      this.resetDocument();
      return true;
    }

    if (this.ticks > 0 && this.ticks < this.fenceLength) {
      this.body += FrameDoc.DOC_END.repeat(this.ticks);
      this.ticks = 0;
    }
    return this.failUnterminated();
  }

  public failure(): string | null {
    return this.failureMessage;
  }

  private classifyRun(argument: Frame, char: string): Frame {
    if (this.opening) {
      const openingLength = this.ticks;
      this.ticks = 0;

      if (openingLength % 2 === 0) {
        this.emitDocument("", openingLength);
        this.resetDocument();
        return this.up.call(argument);
      }

      this.opening = false;
      this.fenceLength = openingLength;
      this.body += char;
      return this;
    }

    if (this.ticks === 0) {
      this.body += char;
      return this;
    }

    if (this.ticks < this.fenceLength) {
      this.body += FrameDoc.DOC_END.repeat(this.ticks) + char;
      this.ticks = 0;
      return this;
    }

    if (this.ticks === this.fenceLength) {
      this.emitDocument(this.body, this.fenceLength);
      this.resetDocument();
      return this.up.call(argument);
    }

    this.failureMessage = "document fence run exceeds the opening fence";
    return this;
  }

  private emitDocument(body: string, fenceLength: number): void {
    const output = new Token(new FrameDoc(body, NilContext, fenceLength));
    const out = this.get(Frame.kOUT);
    out.call(output);
  }

  private failUnterminated(): false {
    this.failureMessage = "unterminated document string";
    return false;
  }

  private resetDocument(): void {
    this.body = "";
    this.opening = true;
    this.ticks = 1;
    this.fenceLength = 0;
    this.failureMessage = null;
  }
}
