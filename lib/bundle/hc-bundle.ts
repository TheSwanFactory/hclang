/**
 * The HC files this package ships, served read-only under the root.
 *
 * Every `hc/*.hc` in the repository is ordinary HC source, and the package
 * bundles all of it under the same path, so a session can include one with
 * `<-`: `Figures <- './hc/figures.hc'` reads `hc/figures.hc`. Nothing is in
 * scope until a program imports it. The path is root-relative like every other
 * path, so it names a location inside the root binding, never one beside a
 * source file or the working directory. A host lays the bundle over its root's
 * store as fixed entries: reading one answers the shipped source, writing one is
 * refused, and every other path, a sibling under `hc/` included, still resolves
 * inside that root. No permission flag and no root widens, so a program gains
 * these reads and nothing else.
 *
 * The sources are compiled into the program from the generated
 * `lib/bundle/hc-sources.ts` (`deno task bundle:embed`, checked by
 * `deno task bundle:check`), so the CLI, the compiled binary, the npm package,
 * `HCLang`, and the browser playground serve the same text without reading a
 * file at run time.
 *
 * @module
 */
import {
  ResourceMapStore,
  type ResourceStore,
} from "../frames/resource-store.ts";
import { HC_SOURCES } from "./hc-sources.ts";

/** Checked and copied once, so a host start or `reset()` only wraps a store. */
const overlayHCBundle = ResourceMapStore.overlay(HC_SOURCES);

/**
 * Lays the bundled HC files over a store as read-only entries.
 *
 * @param store The root's store, which keeps every other path.
 * @returns A store that serves the bundle and delegates the rest.
 */
export function withHCBundle(store: ResourceStore): ResourceStore {
  return overlayHCBundle(store);
}
