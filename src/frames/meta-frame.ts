import * as _ from "lodash";
import { Frame } from "./frame";

export type Context = { [key: string]: Frame; };
export const NilContext: Context = {};

export interface IKeyValuePair extends ReadonlyArray<string | Frame > { 0: string; 1: Frame; }

export class MetaFrame {
  public up: Frame;

  constructor(protected meta = NilContext, isNil = false) {
  }

  public get_here(key: string, origin: MetaFrame = this): Frame {
    const exact = this.meta[key];
    if (exact != null) { return exact; };

    return this.match_here(key);
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

  public meta_copy(): Context {
    return _.clone(this.meta);
  }

  public meta_keys() {
    return _.keys(this.meta);
  }

  public meta_length() {
    return this.meta_keys().length;
  }

  public meta_pairs(): Array<IKeyValuePair> {
    return _.map(this.meta, (value, key): IKeyValuePair => {
      return [key, value];
    });
  }

  public meta_string() {
    return this.meta_pairs().map(([key, value]) => {
      return `.${key} ${value};`;
    }).join(" ");
  }

  protected match_here(key: string): Frame {
    _.forOwn(this.meta, (value, pattern): Frame => {
      if (pattern.length > 1) {
        return value;
      }
    });
    return Frame.missing;
  }
}
