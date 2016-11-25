type Context = { [key: string]: Frame; };
type KeyValue = [string, Frame];
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

  public toMetaKeys() {
    return Object.keys(this.meta);
  }

  public toMetaKeyValuePairs() {
    const keys = this.toMetaKeys();
    let n = keys.length;
    let result: [KeyValue];
    for (let i = 0; i < n; i++) {
      const key = keys[i];
      result.push([key, this.meta[key]]);
    }
    return result;
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
