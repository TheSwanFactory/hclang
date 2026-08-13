import { Frame, FrameDoc, FrameSymbol, NilContext } from "../frames.ts";
import { Lex, Token } from "./lex.ts";
import { sigilizer } from "./sigilizer.ts";
import {
  ScanDisposition,
  type ScanResponse,
  type ScanResult,
} from "../scan.ts";

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

  public constructor() {
    super(FrameDoc);
    this.is.document = true;
  }

  public override call(argument: Frame, _parameter = Frame.nil): Frame {
    return sigilizer.scan(this, argument);
  }

  public override scan(argument: Frame, _source = ""): ScanResponse {
    const char = argument.toString();
    if (char === FrameDoc.DOC_END) {
      this.ticks += 1;
      if (!this.opening && this.ticks > this.fenceLength) {
        return {
          disposition: ScanDisposition.Error,
          message: "document fence run exceeds the opening fence",
        };
      }
      return this;
    }

    return this.classifyRun(argument, char);
  }

  /** Classifies a final pending run and reports whether EOF is valid. */
  public override finishInput(): ScanResponse {
    if (this.opening) {
      if (this.ticks % 2 === 0) {
        this.emitDocument("", this.ticks);
        this.resetDocument();
        return sigilizer.scan(this.up, FrameSymbol.end());
      }
      return this.failUnterminated();
    }

    if (this.ticks === this.fenceLength) {
      this.emitDocument(this.body, this.fenceLength);
      this.resetDocument();
      return sigilizer.scan(this.up, FrameSymbol.end());
    }

    if (this.ticks > 0 && this.ticks < this.fenceLength) {
      this.body += FrameDoc.DOC_END.repeat(this.ticks);
      this.ticks = 0;
    }
    return this.failUnterminated();
  }

  private classifyRun(argument: Frame, char: string): ScanResponse {
    if (this.opening) {
      const openingLength = this.ticks;
      this.ticks = 0;

      if (openingLength % 2 === 0) {
        this.emitDocument("", openingLength);
        this.resetDocument();
        return sigilizer.scan(this.up, argument);
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
      return sigilizer.scan(this.up, argument);
    }

    return {
      disposition: ScanDisposition.Error,
      message: "document fence run exceeds the opening fence",
    };
  }

  private emitDocument(body: string, fenceLength: number): void {
    const output = new Token(new FrameDoc(body, NilContext, fenceLength));
    const out = this.get(Frame.kOUT);
    out.call(output);
  }

  private failUnterminated(): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: "unterminated document string",
    };
  }

  private resetDocument(): void {
    this.body = "";
    this.opening = true;
    this.ticks = 1;
    this.fenceLength = 0;
  }
}
