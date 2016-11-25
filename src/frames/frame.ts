type Context = { [key: string]: Frame; };
interface IKeyValuePair extends Array<string | Frame > { 0: string; 1: Frame; }
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

  private meta_pairs() {
    const keys = this.meta_keys();
    return keys.map((key) => {
      const pair: IKeyValuePair = [key, this.meta[key]];
      return pair;
    });
  }

  public toFunctionalMetaString() {
    let pairs: Array<IKeyValuePair> = this.meta_pairs();
    return pairs.map(([key, value]) => {return `.${key} ${value};`;}).join(" ");
  }

  public toMetaString() {
    let result: Array<string> = [];
    for (let key in this.meta) {
      if (this.meta.hasOwnProperty(key)) {
        let value = this.meta[key];
        result.push(`.${key} ${value};`);
      }
    }
    return result.join(" ");
  }

  public toString() {
    return Frame.BEGIN + this.toMetaString() + Frame.END;
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
