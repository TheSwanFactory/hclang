import * as _ from 'lodash'
import { Frame } from './frame.js'

export interface ISourced extends Frame {
  source: string;
}

export type Context = { [key: string]: Frame; };
export const NilContext: Context = {}

export interface IKeyValuePair extends ReadonlyArray<string | Frame> { 0: string; 1: Frame; }

export class MetaFrame {
  public static id_count = 0
  public up: Frame = Frame.missing
  public id: string

  constructor (public meta = NilContext, _isNil = false) {
    const name = this.constructor.name
    const id = name + '.' + MetaFrame.id_count++
    this.id = '$:' + id
  }

  public get_here (key: string, _origin: MetaFrame = this): Frame {
    const exact = this.meta[key]
    if (exact != null) {
      return exact
    };
    return this.match_here(key)
  }

  public get (key: string, origin: MetaFrame = this): Frame {
    const result = this.get_here(key, origin)
    if (!result.is.missing) {
      return result
    };

    let parent = this.up || Frame.globals
    if (parent.is.missing) {
      if (Frame.globals.is.missing) {
        return Frame.missing
      };
      parent = Frame.globals
    }
    return parent.get(key, origin)
  }

  public set (key: string, value: Frame): MetaFrame {
    if (this.meta === NilContext) {
      this.meta = {}
    }
    this.meta[key] = value
    return this
  }

  public meta_copy (): Context {
    return _.clone(this.meta)
  }

  public meta_keys () {
    return _.keys(this.meta)
  }

  public meta_length () {
    return this.meta_keys().length
  }

  public meta_pairs (): Array<IKeyValuePair> {
    return _.map(this.meta, (value, key): IKeyValuePair => {
      return [key, value]
    })
  }

  public meta_string () {
    return this.meta_pairs().map(([key, value]) => {
      if (key === Frame.kOUT) {
        return `.${key} ${value.id};`
      } else {
        return `.${key} ${value};`
      }
    }).join(' ')
  }

  protected match_here (target: string): Frame {
    let result = Frame.missing
    _.forOwn(this.meta, (value, key) => {
      const isPattern = key.match(/\/(.*)\//)
      if (isPattern) {
        const pattern = new RegExp(isPattern[1])
        if (pattern.test(target)) {
          result = value
          if (result.hasOwnProperty('source')) {
            const sourced = result as ISourced
            sourced.source = target
          }
        }
      }
    })
    return result
  }
}
