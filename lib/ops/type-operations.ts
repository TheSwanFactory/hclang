import { Frame, FrameLazy, FrameLiteral, isFrameMatcher } from "../frames.ts";

/** Test whether a value belongs to a first-class type or schema. */
export const HasType = (source: Frame, type: Frame): Frame => {
  if (type === Frame.all) return Frame.all;
  if (type === Frame.nil) return Frame.nil;
  if (isFrameMatcher(type)) {
    return type.match(source).matched ? Frame.all : Frame.nil;
  }
  return Frame.nil;
};

/** Replace a provisional signature binding with its validated closure. */
export const BindType = (source: Frame, body: Frame): Frame => {
  if (
    source instanceof FrameLiteral && source.binding &&
    body instanceof FrameLazy
  ) {
    const target = source.binding.target.deref();
    if (!target) return source;
    body.bindSignature(source.binding.value);
    target.set(source.binding.key, body);
  }
  return source;
};
