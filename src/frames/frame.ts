
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

  constructor(private meta = Void) {
  }

  public string_open() { return Frame.BEGIN_EXPR; };
  public string_close() { return Frame.END_EXPR; };

  public get_here(key: string) {
    let result = this.meta[key];
    if (result != null) { return result; };
    return Frame.missing;
  }

  public get(key: string, origin = this): Frame {
    let result = this.get_here(key);
    if (result !== Frame.missing) { return result; };
    const up = this.get_here(Frame.kUP);
    if (up === Frame.missing) { return Frame.missing; };
    return up.get(key, origin);
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

  public in(context = Frame.nil): Frame {
    return this;
  }

  public apply(argument: Frame) {
    return argument;
  }

  public called_by(context: Frame) {
    return context.apply(this);
  }

  public call(argument: Frame) {
    return argument.called_by(this);
  }

  public meta_copy(): Context {
    let clone = this.meta.constructor(); // give temp the original obj's constructor
    for (let key in this.meta) {
      if (this.meta.hasOwnProperty(key)) {
        clone[key] = this.meta[key];
      }
    }
    return clone;
  }

  public meta_keys() {
    return Object.keys(this.meta);
  }

  public meta_length() {
    return this.meta_keys().length;
  }

  public meta_pairs() {
    const keys = this.meta_keys();
    return keys.map((key) => {
      const pair: IKeyValuePair = [key, this.meta[key]];
      return pair;
    });
  }

  public meta_string() {
    let pairs: Array<IKeyValuePair> = this.meta_pairs();
    return pairs.map(([key, value]) => { return `.${key} ${value};`; }).join(" ");
  }

  public toString() {
    return this.string_open() + this.meta_string() + this.string_close();
  }

  public toArray(): Array<Frame> {
    return [];
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

  public toArray(): Array<Frame> {
    return [this];
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

  public toArray(): Array<Frame> {
    return this.data;
  }
}
