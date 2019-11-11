import * as _ from "lodash";
import { FrameQuote } from "./frame-atom";
import { Context, NilContext } from "./meta-frame";


export class FrameBytes extends FrameQuote {
  public static readonly BYTES_BEGIN = "\\";
  public static readonly BYTES_END = "\\";

  constructor(protected data: Uint8Array, meta: Context = NilContext) {
    super(meta);
  }

  public string_prefix() { return FrameBytes.BYTES_BEGIN; };

  public string_suffix() { return FrameBytes.BYTES_END; };

  protected toData() { return this.data; }

};
