import { Frame } from '../frames.ts'

export const IfThen = (source: Frame, block: Frame) => {
  if (source !== Frame.nil) {
    return block.call(Frame.nil)
  }
  return Frame.nil
}

export const IfElse = (source: Frame, block: Frame) => {
  if (source === Frame.nil) {
    return block.call(Frame.nil)
  }
  return Frame.nil
}
