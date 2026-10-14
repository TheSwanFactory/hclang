/**
 * The host seam a root binding holds.
 *
 * A store moves bytes for one already-normalized, root-relative path. It is the
 * only part of the resource primitive that touches anything outside the program,
 * and it is an interface rather than an implementation because the two harnesses
 * that exist have nothing in common: the Deno CLI has a filesystem and
 * `hcweb.html` has none. Keeping it here keeps `lib/` free of `Deno`.
 *
 * Refusal is a return value. A store never throws, because a refusal has to
 * reach the program as a frame it can carry, not as an exception that unwinds
 * the fold.
 *
 * @module
 */
import { normalizeReferencePath } from "./resource-reference.ts";

/** One access outcome, where a refusal names its reason without the sigil. */
export type StoreResult =
  | { readonly ok: true; readonly content: string }
  | { readonly ok: false; readonly reason: string };

/** Moves characters for one contained path, or refuses. */
export interface ResourceStore {
  /**
   * The root's identity, for diagnostics only.
   *
   * Never handed to the program: a program that could read its own root could
   * probe the host, which §7 of the security architecture rules out.
   */
  describe(): string;

  /** Reads the whole location, refusing `resource-absent` when there is none. */
  read(path: string): StoreResult;

  /** Replaces the whole location, yielding the content it wrote. */
  write(path: string, content: string): StoreResult;
}

/**
 * A store with no host behind it at all.
 *
 * This is the browser-safe default and the vehicle for deterministic fixtures:
 * a test installs one and a resource reference never touches a real directory.
 * Each instance owns a fresh map, so "a unique root per process" costs nothing
 * and needs no cleanup.
 */
export class MemoryStore implements ResourceStore {
  private readonly contents = new Map<string, string>();

  public constructor(private readonly label = "memory") {}

  public describe(): string {
    return this.label;
  }

  public read(path: string): StoreResult {
    const content = this.contents.get(path);
    return content === undefined
      ? { ok: false, reason: "resource-absent" }
      : { ok: true, content };
  }

  public write(path: string, content: string): StoreResult {
    this.contents.set(path, content);
    return { ok: true, content };
  }
}

/**
 * A read-only overlay of fixed entries, keyed by canonical root-relative path,
 * on another store.
 *
 * A harness uses it to serve package-owned HC source without widening its root:
 * exact keys read their entry and refuse writes, and every other path, plus
 * `describe`, is the underlying store's. Keys are checked once, here, so only a
 * path the root plane itself would produce can be installed; a key that fails is
 * a harness defect, and the constructor throws rather than refusing. The entries
 * are copied, so the caller's map cannot change what the overlay serves.
 */
export class ResourceMapStore implements ResourceStore {
  readonly #entries: ReadonlyMap<string, string>;

  public constructor(
    private readonly underlying: ResourceStore,
    entries: ReadonlyMap<string, string>,
  ) {
    const copied = new Map<string, string>();
    for (const [key, content] of entries) {
      const normal = normalizeReferencePath(key);
      if (key === "" || !normal.ok || normal.path !== key) {
        throw new TypeError(
          `ResourceMapStore key must be a canonical nonempty path: ${
            JSON.stringify(key)
          }`,
        );
      }
      copied.set(key, content);
    }
    this.#entries = copied;
  }

  public describe(): string {
    return this.underlying.describe();
  }

  public read(path: string): StoreResult {
    const content = this.#entries.get(path);
    return content === undefined
      ? this.underlying.read(path)
      : { ok: true, content };
  }

  public write(path: string, content: string): StoreResult {
    return this.#entries.has(path)
      ? { ok: false, reason: "resource-read-only" }
      : this.underlying.write(path, content);
  }
}
