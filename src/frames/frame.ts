import * as _ from "lodash";
import { Context, MetaFrame, NilContext } from "./meta-frame";

export interface IKeyValuePair extends ReadonlyArray<string | Frame > { 0: string; 1: Frame; }

export class Frame extends MetaFrame {
  public static readonly kOUT = ">>";
  public static readonly kEND = "$$";
  public static readonly BEGIN_EXPR = "(";
  public static readonly END_EXPR = ")";
  public static readonly nil = new Frame(NilContext, true);
  public static readonly missing: Frame = new Frame({
    missing: Frame.nil,
  });
  public static globals = Frame.missing;

  public callme: boolean;
  constructor(meta = NilContext, isNil = false) {
    super(meta);
    this.up = Frame.missing;
    this.callme = false;
    if (isNil) {
      this.called_by = (context: Frame, parameter: Frame) => {
        return context;
      };
    }
  }

  public string_open() { return Frame.BEGIN_EXPR; };
  public string_close() { return Frame.END_EXPR; };

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

  public isVoid() {
    return false;
  }
};
