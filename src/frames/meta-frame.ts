import { Frame } from "./frame";

export type Context = { [key: string]: Frame; };
export const NilContext: Context = {};

export class MetaFrame {
  public up: Frame;

  constructor(protected meta = NilContext, isNil = false) {
  }

  public get_here(key: string, origin: MetaFrame = this): Frame {
    const result = this.meta[key];
    if (result != null) { return result; };
    return Frame.missing;
  }

  public get(key: string, origin: MetaFrame = this): Frame {
    const result = this.get_here(key, origin);
    if (result !== Frame.missing) { return result; };

    let source = this.up || Frame.globals;
    if (source === Frame.missing) {
      if (Frame.globals === Frame.missing) { return Frame.missing; };
      source = Frame.globals;
    }
    return source.get(key, origin);
  }

  public set(key: string, value: Frame): MetaFrame {
    if (this.meta === NilContext) {
      this.meta = {};
    }
    this.meta[key] = value;
    return this;
  }
}
