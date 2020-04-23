import { Frame, FrameArg, FrameExpr, FrameLazy, FrameName, FrameParam, FrameString, FrameSymbol } from './frames'
import { tag } from './maml/tag'

const HTML_PREFIX = '<!DOCTYPE html>'

const MakeTag = (name: string, contents: Frame) => {
  return new FrameExpr([
    new FrameSymbol('tag'),
    new FrameString(name),
    contents
  ])
}

const HeadBlock = new FrameLazy([
  new FrameSymbol('tag'),
  FrameParam.there(),
  FrameArg.here()
])

const head = MakeTag(
  'head',
  new FrameExpr([
    FrameArg.here(),
    new FrameName('&&'),
    HeadBlock
  ])
)
const body = MakeTag('body', FrameArg.here())

export const maml = new FrameExpr([
  new FrameString(HTML_PREFIX),
  MakeTag('html', new FrameExpr([head, body]))
], { tag })
