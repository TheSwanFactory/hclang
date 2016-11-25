export type Context = { [key: string]: Frame; };
export interface IKeyValuePair extends ReadonlyArray<string | Frame > { 0: string; 1: Frame; }
const Void: Context = {};

export class Frame {
  public static readonly BEGIN = "(";
  public static readonly END = ")";
  public static readonly nil = new Frame();

  constructor(private meta = Void) {
  }

  public get(key: string) {
    return this.meta[key];
  }

  public in(context = Frame.nil) {
    return this;
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
