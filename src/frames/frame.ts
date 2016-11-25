
export type Context = { [key: string]: Frame; };
export interface IKeyValuePair extends ReadonlyArray<string | Frame > { 0: string; 1: Frame; }
export const Void: Context = {};

export class Frame {
  public static readonly BEGIN = "(";
  public static readonly END = ")";
  public static readonly kUP = "_up";
  public static readonly nil = new Frame();
  public static readonly missing: Frame = new Frame({
    up: Frame.nil,
  });

  constructor(private meta = Void) {
  }

  public get_here(key: string) {
    let result = this.meta[key];
    if (result != null) { return result; };
    return Frame.missing;
  }

  public get(key: string, current = Frame.nil): Frame {
    let result = this.get_here(key);
    if (result != Frame.nil) { return result; };
    const up = this.get_here(Frame.kUP);
    if (up == Frame.nil) { return Frame.nil; };
    return up.get(key, this);
  }

  public in(context = Frame.nil) {
    return <Frame> this;
  }

  public call(argument: Frame) {
    return argument;
  }

  public meta_keys() {
    return Object.keys(this.meta);
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
    return Frame.BEGIN + this.meta_string() + Frame.END;
  }
};

export class FrameArray extends Frame {
  constructor(protected data: Array<Frame>, meta = Void) {
    super(meta);
  }

  public at(index: number) {
    return this.data[index];
  }
}
