import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { FrameString } from "./frame-string";
import { Context, MetaFrame, NilContext } from "./meta-frame";

export type Binding = { [key: string]: string; };
export type LanguageBinding = { [key: string]: Binding; };

export class FrameNote extends FrameQuote {
  public static readonly NOTE_BEGIN = "$";
  public static readonly NOTE_END = ";";

  public static readonly MISSING = "!";
  public static readonly MISMATCH = "<>";

  public static readonly LABELS: LanguageBinding = {
    en: {
      "!": "name-missing",
      "<>": "type-mismatch",
    },
  };

  constructor(protected data: string, source: string, meta = NilContext) {
    super(meta);
    const label = FrameNote.LABELS.en[this.data];
    const value = new FrameString(source);
    this.set(label, value);
  }

  public in(contexts = [Frame.nil]) {
    return this;
  }

  public string_prefix() { return FrameNote.NOTE_BEGIN; };

  public string_suffix() { return FrameNote.NOTE_END; };

  public toString() { return this.string_prefix() + this.data + this.meta_string(); }

  protected toData() { return this.data; }

};
