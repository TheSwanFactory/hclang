
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

  public group_begin() { return Frame.BEGIN_EXPR; };
  public group_end() { return Frame.END_EXPR; };
  public data_begin() { return ""; };
  public data_end() { return ""; };

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

  public toStringData(): string {
    return null;
  }

  public toStringArray(): string[] {
    const DATA_STRING = this.toStringData();
    const result: string[] = [];
    if (DATA_STRING != null) {
      result.push(DATA_STRING);
    }
    if (this.meta_length() > 0) {
      result.push(this.meta_string());
    }
    return result;
  }

  public toString() {
    return this.group_begin() + this.toStringArray().join(", ") + this.group_end();
  }
};
