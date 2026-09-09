/**
 * The Deno CLI's filesystem store.
 *
 * This is one harness's realization of the outer ring, and it lives in `cli/`
 * for that reason: `lib/` has no `Deno` in it, and `hcweb.html` has no
 * filesystem to realize. What the harness contributes is bytes and resolution;
 * every decision about what a reference means was already made by
 * `normalizeReference` before a path reached here.
 *
 * The root is created on first use rather than at startup, so a session that
 * never names a resource leaves nothing behind.
 *
 * @module
 */
import {
  containsResolved,
  type ResourceStore,
  type StoreResult,
} from "../lib/frames.ts";

/** Compares resolved locations on one separator, whatever the host uses. */
const posix = (path: string): string => path.replaceAll("\\", "/");

/** The directory part of an already-normalized, non-empty relative path. */
const parentOf = (path: string): string => {
  const cut = path.lastIndexOf("/");
  return cut < 0 ? "" : path.slice(0, cut);
};

export class DenoFileStore implements ResourceStore {
  private root?: string;

  /** @param prefix Names the temp directory so a stray one is identifiable. */
  public constructor(private readonly prefix = "hclang-root-") {}

  public describe(): string {
    return this.root ?? `${this.prefix}(uncreated)`;
  }

  public read(path: string): StoreResult {
    if (path === "") return { ok: false, reason: "resource-not-a-file" };

    const root = this.ensureRoot();
    const target = `${root}/${path}`;
    const resolved = realPath(target);
    if (resolved === undefined) {
      return { ok: false, reason: "resource-absent" };
    }
    if (!containsResolved(root, resolved)) {
      return { ok: false, reason: "resource-escaped-root" };
    }

    try {
      return { ok: true, content: Deno.readTextFileSync(resolved) };
    } catch {
      return { ok: false, reason: "resource-unreadable" };
    }
  }

  /**
   * Writes, after re-verifying containment on the deepest location that exists.
   *
   * The order matters. Creating the intermediate directories first would follow
   * a symlinked ancestor out of the root and create directories outside it
   * before any check ran, so the check happens against whatever already exists
   * and the directories are created only once that resolved inside the root.
   * Nothing below the deepest existing ancestor can be a symlink, because
   * nothing below it exists.
   */
  public write(path: string, content: string): StoreResult {
    if (path === "") return { ok: false, reason: "resource-not-a-file" };

    const root = this.ensureRoot();
    const target = `${root}/${path}`;
    if (!containsResolved(root, this.deepestExisting(root, path))) {
      return { ok: false, reason: "resource-escaped-root" };
    }

    try {
      const parent = parentOf(path);
      if (parent !== "") {
        Deno.mkdirSync(`${root}/${parent}`, { recursive: true });
      }
      Deno.writeTextFileSync(target, content);
      return { ok: true, content };
    } catch {
      return { ok: false, reason: "resource-unwritable" };
    }
  }

  /** Creates the root on first use and pins its resolved form once. */
  private ensureRoot(): string {
    if (this.root === undefined) {
      const created = Deno.makeTempDirSync({ prefix: this.prefix });
      this.root = realPath(created) ?? posix(created);
    }
    return this.root;
  }

  /**
   * Resolves the longest prefix of the target that the host already has.
   *
   * The root itself always exists, so this terminates with the root rather than
   * with nothing, and a refusal is decided by comparison rather than by absence.
   */
  private deepestExisting(root: string, path: string): string {
    let candidate = path;
    while (candidate !== "") {
      const resolved = realPath(`${root}/${candidate}`);
      if (resolved !== undefined) return resolved;
      candidate = parentOf(candidate);
    }
    return root;
  }
}

/** The resolved location, or undefined when the host has none. */
const realPath = (path: string): string | undefined => {
  try {
    return posix(Deno.realPathSync(path));
  } catch {
    return undefined;
  }
};
