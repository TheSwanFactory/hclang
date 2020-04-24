import * as _ from 'lodash'
import { MetaFrame, NilContext } from './meta-frame'

export type Flags = { [key: string]: boolean; };

export class Frame extends MetaFrame {
  public static readonly kOUT = '>>';
  public static readonly kEND = '$$';
  public static readonly BEGIN_EXPR = '(';
  public static readonly END_EXPR = ')';
  public static readonly nil = new Frame(NilContext, true);
  public static readonly missing: Frame = new Frame(NilContext, false, true);
  public static globals = Frame.missing;

  public is: Flags;

  constructor (meta = NilContext, isNil = false, isMissing = false) {
    super(meta)
    this.up = Frame.missing
    this.is = {}
    if (isNil) {
      this.is.void = true
    }
    if (isMissing) {
      this.is.missing = true
    }
  }

  public string_open () {
    return Frame.BEGIN_EXPR
  };

  public string_close () {
    return Frame.END_EXPR
  };

  public at (_index: number) {
    return Frame.nil
  }

  public in (_contexts = [Frame.nil]): Frame {
    return this
  }

  public apply (argument: Frame, _parameter: Frame) {
    return argument
  }

  public called_by (context: Frame, parameter: Frame) {
    if (this.is.void) {
      return context
    }
    return context.apply(this, parameter)
  }

  public call (argument: Frame, parameter = Frame.nil) {
    if (this.is.void) {
      return argument
    }
    return argument.called_by(this, parameter)
  }

  public toString () {
    return this.string_open() + this.meta_string() + this.string_close()
  }

  public asArray (): Array<Frame> {
    return _.castArray(this)
  }
};
