/**
 * The host namespace a harness hands its evaluator, reached from HC source
 * through `$$`.
 *
 * The CLI (`cli/hc.ts` `getHost`) and the interactive session (`HCLang`) build
 * it the same way and differ only in the store under the root: the CLI's is a
 * fresh temp directory, and a session's is in memory. A session gets an
 * in-memory root because the harnesses that use `HCLang` have no filesystem to
 * offer, and because a session's resources should not outlive it. `reset()`
 * installs a new one, so a cleared session cannot read what the previous one
 * wrote.
 *
 * The root binding is a narrowing: the process still holds whatever the
 * harness granted it, and the root binding is the ceiling the language
 * enforces inside it. The root overlays the bundled, read-only `hc/` files, so
 * `Figures <- './hc/figures.hc'` reads the shipped Figures source and nothing
 * else widens, in the CLI, in the browser playground and in every session after
 * `reset()`. The dispatcher is bound beside it (`$$.dispatch`), so a testdoc
 * can hand its own closures to each dispatch policy (`hc/art-dispatch-vact.hc`)
 * and runs in a session as it does under the CLI.
 *
 * @module
 */
import {
  CLOCK_SCHEME,
  ClockHandler,
  type Context,
  DISPATCH_KEY,
  dispatchNamespace,
  Frame,
  FrameResource,
  RealClock,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
  type ResourceStore,
  type SchemeHandler,
} from "../frames.ts";
import { withHCBundle } from "../bundle/hc-bundle.ts";

/**
 * Builds a host namespace, root binding and dispatcher included.
 *
 * @param context Host bindings, which are copied rather than adopted.
 * @param store The store under the root, before the bundled `hc/` overlay.
 * @param handlers The scheme table under the root; the real clock by default.
 * @returns A frame reachable from HC source through `$$`.
 */
export function hostNamespace(
  context: Context,
  store: ResourceStore,
  handlers: ResourceHandlers = hostHandlers(),
): Frame {
  // A Frame adopts the Context object it is handed, so the bindings are added
  // to a copy: the embedder's declared host values are what the harness
  // reports (`HCLang.getContextString`, the CLI's logger), and installing a
  // capability must not edit that record.
  const host = new Frame({ ...context });
  host.set(
    RESOURCE_ROOT_KEY,
    FrameResource.root(withHCBundle(store), handlers),
  );
  host.set(DISPATCH_KEY, dispatchNamespace());
  return host;
}

/**
 * The host's scheme table.
 *
 * One entry, and the emptiness of every other slot is the point: `'https://…'`
 * refuses because nothing is bound to `https`, not because a rule forbids it.
 * The clock is the real one, the only thing a harness can honestly implement
 * that the root binding does not already cover: a browser has one, and a
 * session is a live session.
 *
 * A harness that holds more, such as the CLI's `--rest` grants, passes them as
 * `extra`; they sit beside the clock and never replace it.
 *
 * @param extra Further entries, by scheme, that a harness installs.
 * @returns The scheme handlers reachable from a host's evaluation.
 */
export function hostHandlers(
  extra: Readonly<Record<string, SchemeHandler>> = {},
): ResourceHandlers {
  return ResourceHandlers.of({
    ...extra,
    [CLOCK_SCHEME]: new ClockHandler(new RealClock()),
  });
}
