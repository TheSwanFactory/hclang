/**
 * The standard modules every supported host serves, read-only, under canonical
 * keys.
 *
 * A standard module is HC source the package maintains: every
 * `lib/modules/*.hc` is one, under the key `modules/<file>`, so
 * `lib/modules/figures.hc` is reached from a program as
 * `'./modules/figures.hc'`. The key is root-relative like every other path, so
 * it names a location inside the root binding, never one beside a source file
 * or the working directory. A host lays the modules over its root's store as
 * fixed entries: reading one answers the maintained source, writing one is
 * refused, and every other path, a sibling under `modules/` included, still
 * resolves inside that root. No permission flag and no root widens, so a program
 * gains these reads and nothing else.
 *
 * The sources are compiled into the program from the generated
 * `lib/modules/standard-sources.ts` (`deno task modules:embed`), so the CLI, the
 * compiled binary, the npm package, `HCLang`, and the browser playground serve
 * the same text without reading a file at run time.
 *
 * @module
 */
import {
  ResourceMapStore,
  type ResourceStore,
} from "../frames/resource-store.ts";
import { STANDARD_SOURCES } from "./standard-sources.ts";

const MODULES: ReadonlyMap<string, string> = STANDARD_SOURCES;

/**
 * The standard modules by canonical key.
 *
 * @returns Each module's source under its key.
 */
export function standardModules(): ReadonlyMap<string, string> {
  return MODULES;
}

/**
 * Lays the standard modules over a store as read-only entries.
 *
 * @param store The root's store, which keeps every other path.
 * @returns A store that serves the standard modules and delegates the rest.
 */
export function withStandardModules(store: ResourceStore): ResourceStore {
  return new ResourceMapStore(store, MODULES);
}
