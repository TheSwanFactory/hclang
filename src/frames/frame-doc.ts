import { FrameString } from './frame-string.ts'
import { Context, NilContext } from './meta-frame.ts'

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = '`'
  public static readonly DOC_END = '`'

  constructor (data: string, meta: Context = NilContext) {
    super(data, meta)
  }

  public override string_prefix () {
    return FrameDoc.DOC_BEGIN
  };

  public override string_suffix () {
    return FrameDoc.DOC_END
  };
};
