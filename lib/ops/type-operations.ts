// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameLazy } from "../frames/frame-lazy.ts";
import { FrameLiteral } from "../frames/frame-symbol.ts";
import { isFrameMatcher } from "../frames/frame-match.ts";

/** The closure a declaration echo now names, if it names one. */
const boundClosure = (source: Frame): FrameLazy | undefined => {
  if (!(source instanceof FrameLiteral) || !source.binding) return undefined;
  const bound = source.binding.target.get(source.binding.key);
  return bound instanceof FrameLazy ? bound : undefined;
};

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
    body.bindSignature(source.binding.value);
    source.binding.target.set(source.binding.key, body);
  }
  return source;
};

/**
 * Attach an output-type contract to a declared closure, the `^^` complement of
 * the `^` input signature. The left operand is the declaration echo produced
 * by `^` (or by the declaration itself), whose name now holds the closure; the
 * right operand is the schema the closure's result must conform to. Binding a
 * return contract neither freezes nor rewrites the closure beyond recording the
 * schema it will check at call time, and the echo is returned unchanged so a
 * `^^` can follow a `^` in one left-associative expression. A `^^` with no
 * closure to bind, or a left operand that is not a live declaration, is left
 * alone rather than erroring, matching how `^` ignores a shape it cannot bind.
 */
export const BindReturn = (source: Frame, returnType: Frame): Frame => {
  const closure = boundClosure(source);
  if (closure) {
    closure.bindReturn(returnType);
  }
  return source;
};
