/**
 * Deterministic normalization for resource references.
 *
 * Pure and total, and deliberately independent of `Frame`: this module decides
 * what a reference means before anything can act on it, so it must be testable
 * without an evaluator and callable before any handler is selected. Nothing here
 * performs access, and nothing here throws.
 *
 * @module
 */

/** RFC 3986 Appendix B decomposition of a URI reference. */
const URI_REFERENCE =
  /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;

/** A percent-escape, or a stray `%` that is not one. */
const ESCAPE = /%([0-9A-Fa-f]{2})?/g;

/** Octets an escape may not decode to, because each one changes the path. */
const FORBIDDEN_OCTETS = new Set([0x2e, 0x2f, 0x5c]);

/** Component names published as metadata for every decomposed reference. */
export const URI_PART_KEYS = [
  "scheme",
  "authority",
  "path",
  "query",
  "fragment",
] as const;

/** One RFC 3986 component name. */
export type URIPartKey = typeof URI_PART_KEYS[number];

/** The five components of a reference, absent ones omitted. */
export type ReferenceParts = Partial<Record<URIPartKey, string>>;

/**
 * The outcome of normalizing one reference.
 *
 * A refusal names its reason in the `$!.…` vocabulary without the sigil, so the
 * caller that has a Frame to build owns the spelling of the error value.
 */
export type Normalization =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly reason: string };

/** Decomposes a reference, omitting components the reference does not have. */
export const decomposeReference = (reference: string): ReferenceParts => {
  const parts: ReferenceParts = {};
  const matched = URI_REFERENCE.exec(reference);
  if (matched === null) return parts;

  URI_PART_KEYS.forEach((key, index) => {
    const value = matched[index + 1];
    if (value !== undefined && value !== "") parts[key] = value;
  });
  return parts;
};

/**
 * Reduces a scheme-less reference to a root-relative path, or refuses.
 *
 * This is the path plane, and it runs before any handler exists to be wrong
 * about containment. A scheme reaching here is a caller that skipped dispatch,
 * so it is refused rather than guessed at: the handler table owns every scheme,
 * and presence of `scheme` is the whole discriminator. A colon inside a path is
 * an ordinary character.
 */
export const normalizeReference = (reference: string): Normalization => {
  const parts = decomposeReference(reference);

  if (parts.scheme !== undefined) {
    return { ok: false, reason: "resource-scheme-unbound" };
  }
  if (parts.authority !== undefined) {
    return { ok: false, reason: "resource-authority-unbound" };
  }
  if (parts.query !== undefined || parts.fragment !== undefined) {
    return { ok: false, reason: "resource-part-unsupported" };
  }

  return normalizeReferencePath(parts.path ?? "");
};

/**
 * Whether a resolved location is still the root or inside it.
 *
 * Textual containment is checked at normalization, but prefix containment does
 * not survive symlink indirection, so a store re-checks its resolved location
 * here before any byte moves. Separator-terminating the root is what stops
 * `/tmp/root-elsewhere` from passing as a child of `/tmp/root`.
 */
export const containsResolved = (
  root: string,
  resolved: string,
  separator = "/",
): boolean => {
  if (root === "") return false;
  if (resolved === root) return true;
  const prefix = root.endsWith(separator) ? root : root + separator;
  return resolved.startsWith(prefix);
};

/** Joins an already-normalized parent and child, which cannot widen. */
export const joinNormalized = (parent: string, child: string): string => {
  if (parent === "") return child;
  if (child === "") return parent;
  return `${parent}/${child}`;
};

/**
 * Normalizes a path component, refusing anything that could leave the root.
 *
 * The refusals are stricter than escape detection needs, deliberately. Every
 * `..` is refused rather than popped, so there is no canonicalization for a
 * checker and a host to disagree about, and an escape decoding to `.`, `/`, or
 * `\` is refused rather than decoded, so the encoded-dot-segment class does not
 * exist. Both costs are nameable refusals on spellings with no purpose inside a
 * rooted subtree.
 *
 * Exported because a scheme handler backed by a store needs the same rule: a
 * scheme must not become a way to spell a path the root plane would refuse. It
 * takes a path, not a reference, so a colon inside it stays an ordinary
 * character rather than reading as a scheme.
 */
export const normalizeReferencePath = (path: string): Normalization => {
  if (path.includes("\\")) {
    return { ok: false, reason: "resource-alternate-separator" };
  }
  // deno-lint-ignore no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(path)) {
    return { ok: false, reason: "resource-control-character" };
  }

  const decoded = decodePath(path);
  if (!decoded.ok) return decoded;

  const segments: string[] = [];
  for (const segment of decoded.path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      return { ok: false, reason: "resource-parent-escape" };
    }
    segments.push(segment);
  }
  return { ok: true, path: segments.join("/") };
};

/**
 * Percent-decodes a path, refusing malformed and structurally significant
 * escapes.
 *
 * Escapes are inspected before anything is decoded, so a refusal never depends
 * on the order the runtime happens to decode in. What remains is decoded as
 * UTF-8; a sequence that is not valid UTF-8 is a refusal rather than a throw,
 * which is what keeps this function total.
 */
const decodePath = (path: string): Normalization => {
  let malformed = false;
  let forbidden = false;

  for (const [, hex] of path.matchAll(ESCAPE)) {
    if (hex === undefined) {
      malformed = true;
      continue;
    }
    const octet = Number.parseInt(hex, 16);
    if (FORBIDDEN_OCTETS.has(octet) || octet < 0x20 || octet === 0x7f) {
      forbidden = true;
    }
  }

  if (malformed) return { ok: false, reason: "resource-invalid-encoding" };
  if (forbidden) return { ok: false, reason: "resource-encoded-separator" };

  try {
    return { ok: true, path: decodeURIComponent(path) };
  } catch {
    return { ok: false, reason: "resource-invalid-encoding" };
  }
};
