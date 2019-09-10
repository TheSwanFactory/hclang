import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { FrameString } from "./frame-string";
import { Context, MetaFrame, NilContext } from "./meta-frame";

export type Binding = { [key: string]: string; };
export type LanguageBinding = { [key: string]: Binding; };

export class FrameNote extends FrameQuote {
  public static readonly NOTE_BEGIN = "$";
  public static readonly NOTE_END = ";";

  public static readonly LABELS: LanguageBinding = {
    en: {
      "!": "name-missing",
      "<>": "type-mismatch",
      ">": "bounds-exceeded",
    },
  };

  public static key(source: string) { return new FrameNote("!", source); };
  public static type(source: string) { return new FrameNote("<>", source); };
  public static index(source: string) { return new FrameNote(">", source); };
  public static pass(source: string) { return new FrameNote("+", source); };
  public static fail(source: string) { return new FrameNote("-", source); };

  constructor(protected data: string, source: string, meta = NilContext) {
    super(meta);
    const label = FrameNote.LABELS.en[this.data];
    if (label) {
      const value = new FrameString(source);
      this.set(label, value);
    } else {
      const value = new FrameString(data);
      this.set("!", value);
    }
  }

  public in(contexts = [Frame.nil]) {
    return this;
  }

  public string_prefix() { return FrameNote.NOTE_BEGIN; };

  public string_suffix() { return FrameNote.NOTE_END; };

  public toString() { return this.string_prefix() + this.data + this.meta_string(); }

  public isNote() {
    return true;
  }

};
