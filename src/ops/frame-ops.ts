import { Frame } from '../frames/frame'
import { FrameCurry, ICurryFunction } from './frame-curry'

export type FuncDict = { [key: string]: ICurryFunction; };

export class FrameOps extends Frame {
  constructor (protected OpsDict: FuncDict) {
    super()
  }

  public get (key: string, origin: Frame): Frame {
    const func = this.OpsDict[key]
    if (func != null) {
      return this.curry(func, origin, key)
    }
    // return FrameNote.key(key, origin);
    return Frame.missing
  }

  public toString () {
    return this.OpsDict.toString()
  }

  protected curry (func: ICurryFunction, origin: Frame, key: string): Frame {
    const expr = new FrameCurry(func, origin, key)
    return expr
  }
}
