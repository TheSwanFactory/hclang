/**
 * The metadata base and Frame share one declaration module: metadata lookup
 * needs Frame's sentinels, while Frame extends MetaFrame. Keep this public
 * entry point without an inheritance cycle between the two modules.
 */
export {
  type BindingResolution,
  type ISourced,
  MetaFrame,
  Visibility,
} from "./frame.ts";
