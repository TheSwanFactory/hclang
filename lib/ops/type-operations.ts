// Direct, not ../frames.ts, whose ../ops.ts needs this module loaded first.
import { Frame } from "../frames/frame.ts";
import { FrameLazy } from "../frames/frame-lazy.ts";
import { FrameLiteral } from "../frames/frame-symbol.ts";
import { isFrameMatcher } from "../frames/frame-match.ts";
import {
  installEffectInvoker,
  registerEffect,
} from "../frames/effect-registry.ts";

// Install the one strategy the effect registry uses to invoke a registered
// callback. A callback is an ordinary closure, so a committed mutation calls it
// with the managed value as its argument — a *new invocation*, never an
// alteration of a value it returned earlier. Installed here, where FrameLazy is
// already imported, so `frame.ts` need not depend on closure machinery.
installEffectInvoker((callback: Frame, managed: Frame): Frame =>
  callback.call(managed, Frame.nil)
);

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

/**
 * Register an effect boundary: `A -> B` (occurrence/history 006.17 §3-4).
 *
 * `A` is the managed value on the left; `B` is the callback on the right. This
 * records `B` as an observer of `A`'s managed referent so that a *subsequent
 * committed mutation of that value, by any actor through any alias*, is a new
 * invocation of `B`. The arrow is an effect boundary, not a write-authority
 * boundary: registration neither grants nor withholds write permission, does
 * not freeze/copy/convert `A`, and is independent of whether any handle to `A`
 * is mutable.
 *
 * The managed identity is `A`'s referent — the same frame a mutating write
 * lands its `set`/`replaceMember` on — so a handle (`a_`) and the value it
 * wraps register one and the same subscription. The arrow answers `A`
 * unchanged, so it composes left-associatively like `^`/`^^` and leaves the
 * one-shot/return spellings untouched. A left operand with no mutable identity
 * (a bare scalar) registers against its own frame; nothing fires until that
 * frame is actually mutated, which a scalar never is.
 */
export const Arrow = (source: Frame, callback: Frame): Frame => {
  const managed = source.referent();
  registerEffect(managed, callback);
  return source;
};
