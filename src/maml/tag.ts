import { FrameArg, FrameArray, FrameExpr, FrameLazy, FrameString } from '../frames.js'

const wrapArg = (prefix: string, suffix: string) => {
  return new FrameExpr([
    new FrameString(prefix),
    FrameArg.here(),
    new FrameString(suffix)
  ])
}

export const tag = new FrameExpr([
  new FrameLazy([]),
  new FrameArray([
    wrapArg('<', '>'),
    FrameArg.level(2),
    wrapArg('</', '>')
  ])
])
