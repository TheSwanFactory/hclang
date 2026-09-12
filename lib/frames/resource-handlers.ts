/**
 * Per-scheme code that mocks, blocks, or implements.
 *
 * The table is the whole discriminator for the `:`-versus-ports question. Two
 * cases, and the colon is never consulted: a reference that publishes a `scheme`
 * dispatches to that scheme's entry, and a reference that publishes none is a
 * path resolved against the root binding, where a colon is an ordinary path
 * character.
 *
 * A scheme with no entry is an **empty slot**, so refusal is structural rather
 * than a policy rule someone has to write and keep current. The table is also
 * the enumerable adapter surface: the set of things that can reach the host is a
 * data structure a harness can read, which turns "every external effect passes
 * through a resource frame" from a promise into a testable claim.
 *
 * Installation is harness-only. A handler is a TypeScript value, never an HC
 * one: there is no spelling that installs, replaces, or enumerates an entry, and
 * a resource holds its table privately rather than as metadata.
 *
 * @module
 */
import { Frame } from "./frame.ts";
import { FrameString } from "./frame-string.ts";
import {
  normalizeReferencePath,
  type ReferenceParts,
} from "./resource-reference.ts";
import type { ResourceStore } from "./resource-store.ts";

/** A refusal, naming its reason in the `$!.…` vocabulary without the sigil. */
type Refusal = { readonly ok: false; readonly reason: string };

/**
 * What a handler answers for a read.
 *
 * Elements rather than text, because a handler is not required to be a byte
 * store: a clock answers one instant, and forcing it through a character stream
 * would make every reader re-parse what the handler already knew.
 */
export type HandlerRead =
  | { readonly ok: true; readonly elements: readonly Frame[] }
  | Refusal;

/** What a handler answers for a write: the evidence, or a refusal. */
export type HandlerWrite =
  | { readonly ok: true; readonly count: number }
  | Refusal;

/** One scheme's implementation, held by a harness and never by a program. */
export interface SchemeHandler {
  /** This entry's identity, for a harness or a test, never for a program. */
  describe(): string;

  /** Reads the reference, which is already decomposed and never re-parsed. */
  read(reference: ReferenceParts): HandlerRead;

  /** Writes the reference, answering how many characters it accepted. */
  write(reference: ReferenceParts, content: string): HandlerWrite;
}

/** The character elements a text-backed handler answers. */
export const characterElements = (content: string): Frame[] =>
  [...content].map((character) => new FrameString(character));

/**
 * An immutable scheme table.
 *
 * Immutable because a nested harness must be able to attenuate without being
 * able to widen: `restrict` intersects, so a child's table is always a subset of
 * its parent's, and there is no operation that adds an entry to an existing
 * table. That is where the induction over resource frames is preserved or
 * broken, so it is a property of the type rather than a rule for a caller.
 */
export class ResourceHandlers {
  /** The table every harness starts from, where every scheme is an empty slot. */
  public static readonly none: ResourceHandlers = new ResourceHandlers(
    new Map(),
  );

  /** Builds a table, folding scheme case as RFC 3986 §3.1 requires. */
  public static of(
    entries: Readonly<Record<string, SchemeHandler>>,
  ): ResourceHandlers {
    const table = new Map<string, SchemeHandler>();
    for (const [scheme, handler] of Object.entries(entries)) {
      table.set(scheme.toLowerCase(), handler);
    }
    return new ResourceHandlers(table);
  }

  private constructor(
    private readonly entries: ReadonlyMap<string, SchemeHandler>,
  ) {}

  /** The bound schemes, sorted, for a harness to read or a test to assert. */
  public schemes(): readonly string[] {
    return [...this.entries.keys()].sort();
  }

  /** This scheme's entry, or undefined for an empty slot. */
  public handler(scheme: string): SchemeHandler | undefined {
    return this.entries.get(scheme.toLowerCase());
  }

  /**
   * The subset of this table naming the given schemes.
   *
   * A scheme this table does not bind stays unbound, so composition is
   * attenuation-only by construction rather than by check.
   */
  public restrict(schemes: Iterable<string>): ResourceHandlers {
    const kept = new Map<string, SchemeHandler>();
    for (const scheme of schemes) {
      const handler = this.handler(scheme);
      if (handler !== undefined) kept.set(scheme.toLowerCase(), handler);
    }
    return new ResourceHandlers(kept);
  }
}

/**
 * A store bound to one scheme.
 *
 * This is what makes simulated-versus-live parity two table entries rather than
 * two deliverables, and a deterministic fixture one entry rather than a test
 * harness: the program is byte-identical, because the only thing that changed is
 * which store the scheme resolves to.
 */
export class StoreHandler implements SchemeHandler {
  public constructor(private readonly store: ResourceStore) {}

  public describe(): string {
    return this.store.describe();
  }

  public read(reference: ReferenceParts): HandlerRead {
    const path = this.locate(reference);
    if (typeof path !== "string") return path;

    const read = this.store.read(path);
    return read.ok
      ? { ok: true, elements: characterElements(read.content) }
      : read;
  }

  public write(reference: ReferenceParts, content: string): HandlerWrite {
    const path = this.locate(reference);
    if (typeof path !== "string") return path;

    const written = this.store.write(path, content);
    return written.ok ? { ok: true, count: written.content.length } : written;
  }

  /**
   * The store-relative path, or the refusal that stops it existing.
   *
   * The same normalization the root plane uses, so a scheme cannot become a way
   * to spell a path the root binding would have refused.
   */
  private locate(reference: ReferenceParts): string | Refusal {
    if (reference.authority !== undefined) {
      return { ok: false, reason: "resource-authority-unbound" };
    }
    if (reference.query !== undefined || reference.fragment !== undefined) {
      return { ok: false, reason: "resource-part-unsupported" };
    }
    const normal = normalizeReferencePath(reference.path ?? "");
    return normal.ok ? normal.path : normal;
  }
}
