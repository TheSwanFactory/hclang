import { Frame, FrameArray, FrameNumber, FrameString } from '../frames.js'

export const MapEnumerable = (source: Frame, block: Frame) => {
  let i = 0
  const array = source.asArray().map((value) => {
    const param = FrameNumber.for(i.toString())
    i += 1
    return block.call(value, param)
  })
  return new FrameArray(array)
}

export const MapProperties = (source: Frame, block: Frame) => {
  const array = source.meta_pairs().map(([key, value]) => {
    const fkey = new FrameString(key)
    return block.call(value, fkey)
  })
  return new FrameArray(array)
}

export const ReduceEnumerable = (source: Frame, block: Frame) => {
  let i = 0
  const FrameReducer = (sum: Frame, value: Frame) => {
    const param = FrameNumber.for(i.toString())
    i += 1
    return sum.call(value, param)
  }
  const result = source.asArray().reduce(FrameReducer, block)
  return result
}
