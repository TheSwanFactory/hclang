import {  Frame } from "./frame";
import { Context, NilContext } from "./meta-frame";

export interface IStringConstructor {
    new (data: string, meta: Context): FrameAtom;
}

export class FrameAtom extends Frame {
  constructor(meta = NilContext) {
    super(meta);
  }

  public string_prefix() { return ""; };
  public string_suffix() { return ""; };
  public string_start() { return this.string_prefix(); };

  public toStringData(): string {
    return this.string_prefix() + this.toData().toString() + this.string_suffix();
  }

  public toString() {
    const dataString = this.toStringData();
    if (this.meta_length() === 0) {
      return dataString;
    }
    return this.string_open() + [dataString, this.meta_string()].join(", ") + this.string_close();
  }

  public canInclude(char: string) {
    return char !== this.string_suffix();
  }

  protected toData(): any { return null; }
}

export class FrameQuote extends FrameAtom {
}
