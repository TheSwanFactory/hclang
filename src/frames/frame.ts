import * as _ from "lodash";

export type Context = { [key: string]: Frame; };
export interface IKeyValuePair extends ReadonlyArray<string | Frame > { 0: string; 1: Frame; }
export const Void: Context = {};

export class Frame {
  public static readonly BEGIN_EXPR = "(";
  public static readonly END_EXPR = ")";
  public static readonly kUP = ".up";
  public static readonly nil = new Frame();
  public static readonly missing: Frame = new Frame({
    missing: Frame.nil,
  });
  public static globals = Frame.missing;

  constructor(private meta = Void) {
  }

  public string_open() { return Frame.BEGIN_EXPR; };
  public string_close() { return Frame.END_EXPR; };

  public get_here(key: string, origin = this): Frame {
    let result = this.meta[key];
    if (result != null) { return result; };
    return Frame.missing;
  }

  public get(key: string, origin: Frame = this): Frame {
    const sources: Array<Frame> = [this, this.get_here(Frame.kUP), Frame.globals];
    for (let source of sources) {
      if (source !== Frame.missing) {
        let result = source.get_here(key, origin);
        if (result !== Frame.missing) { return result; };
      }
    }
    return Frame.missing;
  }

  public set(key: string, value: Frame): Frame {
    if (this.meta === Void) {
      this.meta = {};
    }
    this.meta[key] = value;
    return this;
  }

  public at(index: number) {
    return Frame.nil;
  }

  public in(contexts = [Frame.nil]): Frame {
    return this;
  }

  public apply(argument: Frame, parameter: Frame) {
    return argument;
  }

  public called_by(context: Frame, parameter: Frame) {
    return context.apply(this, parameter);
  }

  public call(argument: Frame, parameter = Frame.nil) {
    return argument.called_by(this, parameter);
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

  public toString() {
    return this.string_open() + this.meta_string() + this.string_close();
  }

  public asArray(): Array<Frame> {
    return _.castArray(this);
  }
};

export class FrameAtom extends Frame {
  public string_prefix() { return ""; };
  public string_suffix() { return ""; };

  public toStringData(): string {
    return this.string_prefix() + this.toData().toString() + this.string_suffix();
  }

  public toString() {
    const DataString = this.toStringData();
    if (this.meta_length() === 0) {
      return DataString;
    }
    return this.string_open() + [DataString, this.meta_string()].join(", ") + this.string_close();
  }

  protected toData(): any { return null; }
}

export class FrameList extends Frame {
  constructor(protected data: Array<Frame>, meta = Void) {
    super(meta);
  }

  public toStringDataArray() {
    return this.data.map((obj: Frame) => { return obj.toString(); });
  };

  public toStringArray(): string[] {
    const result = this.toStringDataArray();
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
    }
    return result;
  }

  public toString() {
    return this.string_open() + this.toStringArray().join(", ") + this.string_close();
  }

  public asArray(): Array<Frame> {
    return this.data;
  }
}
