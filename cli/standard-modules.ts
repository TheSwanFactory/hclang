/**
 * The standard modules this harness serves, read-only, under canonical keys.
 *
 * A standard module is HC source the package maintains: `lib/modules/figures.hc`
 * is reached from a program as `'./modules/figures.hc'`. The key is
 * root-relative like every other path, so it names a location inside the root
 * binding, never one beside this file or the working directory. The harness
 * reads the maintained bytes itself and lays them over the root's store as one
 * fixed entry: reading it answers those bytes, writing it is refused, and every
 * other path, a sibling under `modules/` included, still resolves inside the
 * fresh root. No permission flag and no root widens, so a program gains one
 * read and nothing else.
 *
 * The bytes are located relative to this module's own URL, which resolves in
 * every CLI distribution: the repository checkout, the compiled binary (which
 * embeds the file with `--include`), and the npm package (whose build copies it
 * beside `esm/cli`).
 *
 * @module
 */
import { ResourceMapStore, type ResourceStore } from "../lib/frames.ts";

/** The canonical, root-relative key the Figures module is served under. */
export const FIGURES_MODULE_KEY = "modules/figures.hc";

/** The maintained artifact, located beside this module in every build. */
const FIGURES_MODULE_URL = new URL(
  "../lib/modules/figures.hc",
  import.meta.url,
);

let modules: ReadonlyMap<string, string> | undefined;

/**
 * The standard modules by canonical key, read once per process.
 *
 * Read on first use rather than when this module is evaluated, so importing it
 * performs no I/O.
 *
 * @returns Each module's source under its key.
 */
export function standardModules(): ReadonlyMap<string, string> {
  modules ??= new Map([
    [FIGURES_MODULE_KEY, Deno.readTextFileSync(FIGURES_MODULE_URL)],
  ]);
  return modules;
}

/**
 * Lays the standard modules over a store as read-only entries.
 *
 * @param store The root's store, which keeps every other path.
 * @returns A store that serves the standard modules and delegates the rest.
 */
export function withStandardModules(store: ResourceStore): ResourceStore {
  return new ResourceMapStore(store, standardModules());
}
