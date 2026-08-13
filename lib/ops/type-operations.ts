import {
  Frame,
  FrameLazy,
  FrameLiteral,
  FrameSchema,
  FrameType,
} from "../frames.ts";

/** Test whether a value belongs to a first-class type or schema. */
export const HasType = (source: Frame, type: Frame): Frame => {
  if (type === Frame.all) return Frame.all;
  if (type === Frame.nil) return Frame.nil;
  if (type instanceof FrameType) {
    return type.matches(source) ? Frame.all : Frame.nil;
  }
  if (type instanceof FrameSchema) {
    return type.matches(source) ? Frame.all : Frame.nil;
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
