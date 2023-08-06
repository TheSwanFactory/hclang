import * as _ from 'lodash'
import { Frame } from './frame'
import { FrameString } from './frame-string'
import { FrameSymbol } from './frame-symbol'
import { Context, NilContext } from './meta-frame'

export class FrameDoc extends FrameString {
  public static readonly DOC_BEGIN = '`'
  public static readonly DOC_END = '`'

  constructor (data: string, meta: Context = NilContext) {
    super(data, meta)
  }

  public string_prefix () {
    return FrameDoc.DOC_BEGIN
  };

  public string_suffix () {
    return FrameDoc.DOC_END
  };
};
