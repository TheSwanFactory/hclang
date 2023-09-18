import * as _ from 'lodash.js'
import { FrameString } from './frame-string.js'
import { Context, NilContext } from './meta-frame.js'

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
