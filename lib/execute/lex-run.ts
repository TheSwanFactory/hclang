/**
 * Monadic parser for delimiter families whose run length selects nesting depth.
 *
 * One shared rule serves every such family. Outside a value, an odd run opens
 * one whose fence is that entire run and an even run produces one empty value.
 * Inside, a shorter run is literal content, an equal run closes, and a longer
 * run is a lexical error. Run length selects depth, never type: the family is
 * fixed by the delimiter alone.
 *
 * A physical input chunk does not terminate a pending run. The run is
 * classified only when a different character, a logical newline, or EOF
 * establishes its maximal length.
 *
 * @module
 */
import { Frame, FrameSymbol } from "../frames.ts";
import { LexHost, Token } from "./lex.ts";
import { sigilizer } from "./sigilizer.ts";
import {
  type RunSyntax,
  ScanDisposition,
  type ScanResponse,
  type ScanResult,
} from "../scan.ts";

export class LexRun extends LexHost {
  private opening = true;
  private ticks = 1;
  private fenceLength = 0;

  public constructor(private Runs: RunSyntax) {
    super(Runs);
    this.is.document = Runs.RUN_OPAQUE;
  }

  public override scan(argument: Frame, _source = ""): ScanResponse {
    const char = argument.toString();
    if (char === this.Runs.RUN_DELIMITER) {
      this.ticks += 1;
      if (!this.opening && this.ticks > this.fenceLength) {
        return this.failExcessRun();
      }
      return this;
    }

    return this.classifyRun(argument, char);
  }

  /** Classifies a final pending run and reports whether EOF is valid. */
  public override finishInput(): ScanResponse {
    if (this.opening) {
      if (this.ticks % 2 === 0) {
        this.emitRun("", this.ticks);
        this.resetRun();
        return sigilizer.scan(this.up, FrameSymbol.end());
      }
      return this.failUnterminated();
    }

    if (this.ticks === this.fenceLength) {
      this.emitRun(this.body, this.fenceLength);
      this.resetRun();
      return sigilizer.scan(this.up, FrameSymbol.end());
    }

    if (this.ticks > 0 && this.ticks < this.fenceLength) {
      this.body += this.Runs.RUN_DELIMITER.repeat(this.ticks);
      this.ticks = 0;
    }
    return this.failUnterminated();
  }

  private classifyRun(argument: Frame, char: string): ScanResponse {
    if (this.opening) {
      const openingLength = this.ticks;
      this.ticks = 0;

      if (openingLength % 2 === 0) {
        this.emitRun("", openingLength);
        this.resetRun();
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
      this.body += this.Runs.RUN_DELIMITER.repeat(this.ticks) + char;
      this.ticks = 0;
      return this;
    }

    if (this.ticks === this.fenceLength) {
      this.emitRun(this.body, this.fenceLength);
      this.resetRun();
      return sigilizer.scan(this.up, argument);
    }

    return this.failExcessRun();
  }

  private emitRun(body: string, runLength: number): void {
    const output = new Token(this.Runs.fromRun(body, runLength));
    const out = this.get(Frame.kOUT);
    out.call(output);
  }

  private failExcessRun(): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: `${this.Runs.RUN_LABEL} fence run exceeds the opening fence`,
    };
  }

  private failUnterminated(): ScanResult {
    return {
      disposition: ScanDisposition.Error,
      message: `unterminated ${this.Runs.RUN_LABEL} string`,
    };
  }

  private resetRun(): void {
    this.body = "";
    this.opening = true;
    this.ticks = 1;
    this.fenceLength = 0;
  }
}
