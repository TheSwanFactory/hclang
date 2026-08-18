import { Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameString } from "./frame-string.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext, type StringMap } from "./context.ts";
import { unterminatedAtEnd } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

export type LanguageBinding = { [key: string]: StringMap };

export class FrameNote extends FrameAtom {
  public static readonly NOTE_BEGIN = "$";
  public static readonly NOTE_END = ";";
  public static readonly NOTE_EXTRAS = "++";
  public static readonly SIGIL_STARTS = [
    { key: FrameNote.NOTE_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameNote",
    SIGIL_STARTS: FrameNote.SIGIL_STARTS,
    // A note's terminator is redispatched, so it can also close its enclosure.
    recognize: (symbol: Frame): ScanResult => ({
      disposition: symbol.toString() === FrameNote.NOTE_END
        ? ScanDisposition.CompleteRedispatch
        : ScanDisposition.Consume,
    }),
    finish: unterminatedAtEnd("FrameNote", FrameNote.NOTE_BEGIN),
    fromSource: (source: string): Frame => new FrameNote(source),
  };

  public static readonly LABELS: LanguageBinding = {
    en: {
      "!": "name-missing",
      "+": "test-pass",
      "-": "test-fail",
      "~": "test-unimplemented",
      "=": "test-summary",
      "<>": "type-mismatch",
      ">": "bounds-exceeded",
    },
  };

  public static test(data: string, source: string, sum: string): FrameNote {
    const note = new FrameNote(data, source);
    const result = new FrameString(sum);
    note.set("n", result);
    return note;
  }

  public static key(source: string, where: Frame): FrameNote {
    return new FrameNote("!", source, where);
  }

  public static type(source: string): FrameNote {
    return new FrameNote("<>", source);
  }

  public static index(source: string): FrameNote {
    return new FrameNote(">", source);
  }

  public static pass(source: string, sum: string): FrameNote {
    return FrameNote.test("+", source, sum);
  }

  public static fail(source: string, sum: string): FrameNote {
    return FrameNote.test("-", source, sum);
  }

  public static unimplemented(source: string, sum: string): FrameNote {
    return FrameNote.test("~", source, sum);
  }

  public static summary(source: string, sum: string): FrameNote {
    return FrameNote.test("=", source, sum);
  }

  constructor(
    protected data: string,
    source: string = "",
    public where = Frame.nil,
  ) {
    super(NilContext);
    this.up = where;
    this.is.note = true;
    this.setLabel(data, source);
    this.id += this.data;
  }

  public override in(_contexts = [Frame.nil]): Frame {
    return this;
  }

  public override call(argument: Frame, parameter = Frame.nil): Frame {
    if (argument !== FrameSymbol.end()) {
      const result = this.addExtra(argument, parameter);
      return result;
    }
    const output = this.get(Frame.kOUT);
    output.call(this);
    output.call(FrameSymbol.end());
    return this.up;
  }

  public override string_prefix(): string {
    return FrameNote.NOTE_BEGIN;
  }

  public override string_suffix(): string {
    return FrameNote.NOTE_END;
  }

  public override toString(): string {
    return this.string_prefix() + this.data + this.meta_string();
  }

  protected setLabel(data: string, source: string): void {
    const label = FrameNote.LABELS.en[data];
    let value = new FrameString(data);
    let key = "!";
    if (label) {
      key = label;
      value = new FrameString(source);
    }
    if (key === "!") {
      this.is.missing = true;
    }
    this.set(key, value);
  }

  protected addExtra(argument: Frame, parameter: Frame): FrameNote {
    let extras = this.get(FrameNote.NOTE_EXTRAS);
    if (extras.is.missing) {
      extras = new FrameArray([]);
      this.set(FrameNote.NOTE_EXTRAS, extras);
    }
    extras.apply(argument, parameter);
    return this;
  }
}
