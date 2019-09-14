import { Frame } from "./frame";
import { FrameArray } from "./frame-array";
import { FrameQuote } from "./frame-atom";
import { FrameString } from "./frame-string";
import { NilContext } from "./meta-frame";

export type Binding = { [key: string]: string; };
export type LanguageBinding = { [key: string]: Binding; };

export class FrameNote extends FrameQuote {
  public static readonly NOTE_BEGIN = "$";
  public static readonly NOTE_END = ";";
  public static readonly NOTE_EXTRAS = "++";

  public static readonly LABELS: LanguageBinding = {
    en: {
      "!": "name-missing",
      "+": "test-pass",
      "-": "test-fail",
      "<>": "type-mismatch",
      ">": "bounds-exceeded",
    },
  };

  public static test(data: string, source: string, sum: string) {
     const note = new FrameNote(data, source);
     const result = new FrameString(sum);
     note.set("n", result);
     return note;
   };

  public static key(source: string) { return new FrameNote("!", source); };
  public static type(source: string) { return new FrameNote("<>", source); };
  public static index(source: string) { return new FrameNote(">", source); };
  public static pass(source: string, sum: string) { return FrameNote.test("+", source, sum); };
  public static fail(source: string, sum: string) { return FrameNote.test("-", source, sum); };

  constructor(protected data: string, source: string, meta = NilContext) {
    super(meta);
    const label = FrameNote.LABELS.en[this.data];
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

  public in(_contexts = [Frame.nil]) {
    return this;
  }

  public call(argument: Frame, parameter = Frame.nil) {
    let extras = this.get(FrameNote.NOTE_EXTRAS);
    if (extras.is.missing) {
      extras = new FrameArray([]);
      this.set(FrameNote.NOTE_EXTRAS, extras);
    }
    extras.apply(argument, parameter);
    return this;
  }

  public string_prefix() { return FrameNote.NOTE_BEGIN; };

  public string_suffix() { return FrameNote.NOTE_END; };

  public toString() { return this.string_prefix() + this.data + this.meta_string(); }

  public isNote() {
    return true;
  }

};
