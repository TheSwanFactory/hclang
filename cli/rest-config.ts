/**
 * `--rest <file>`: the CLI's REST grants, read once at startup.
 *
 * The file holds a JSON list of grants. Each names its `base`, its `transport`
 * (`"live"`, or a fixtures file for `RestSimulator`), the four budgets
 * (`requests`, `responseBytes`, `timeoutMs`, `lifetimeMs`), its `evidence`
 * file, and optionally `requestHeaders` and `responseHeaders` to add to the
 * default allowlists. Relative paths resolve against the file's directory.
 *
 * Startup refuses, rather than installing a weaker table, when:
 * - a grant fails `restGrantPolicy`, or the file has a key it does not know;
 * - an evidence path lies inside the program's root binding, where HC could
 *   reach it;
 * - a live grant's host lacks net permission, or net permission is granted for
 *   a sentinel host no grant names (`example.invalid`), which means the
 *   permission is broader than the grants.
 *
 * HC still has no spelling that installs, replaces or enumerates an entry
 * (a12 §2): the table is built here, before the first line runs.
 *
 * @module
 */
import { dirname, isAbsolute, join, resolve } from "@std/path";
import {
  containsResolved,
  type RestEvidence,
  type RestEvidenceSink,
  type RestFixture,
  RestGrant,
  type RestGrantPolicy,
  restGrantPolicy,
  type RestGrantSpec,
  RestHandler,
  RestSimulator,
  type RestTransport,
  type SchemeHandler,
} from "../lib/frames.ts";
import { LiveTransport } from "./rest-worker.ts";
/** A host no grant names; net permission for it means the flag is too broad. */
export const SENTINEL_HOST = "example.invalid";
/** The keys a grant entry may hold. */
const GRANT_KEYS = new Set([
  "base",
  "transport",
  "requests",
  "responseBytes",
  "timeoutMs",
  "lifetimeMs",
  "evidence",
  "requestHeaders",
  "responseHeaders",
]);
/** How the CLI asks about net permission; a test substitutes its own. */
export type NetPermission = (host: string) => Deno.PermissionState;
/** The real permission query. */
export const queryNet: NetPermission = (
  host: string,
): Deno.PermissionState =>
  Deno.permissions.querySync({ name: "net", host }).state;
/** What `--rest` installs. */
export interface RestInstall {
  /** Handler table entries, by scheme. */
  readonly handlers: Readonly<Record<string, SchemeHandler>>;
  /** Every grant, in file order, for a harness or a test. */
  readonly grants: readonly RestGrant[];
  /** Stops any live transport's worker. */
  close(): void;
}
/** Evidence appended to a file, synchronously. */
export class FileEvidence implements RestEvidenceSink {
  public constructor(private readonly path: string) {}
  public append(record: RestEvidence): boolean {
    try {
      Deno.writeTextFileSync(this.path, `${JSON.stringify(record)}\n`, {
        append: true,
        create: true,
      });
      return true;
    } catch {
      return false;
    }
  }
}
/** The resolved form of a path whose parent exists and whose last step may not. */
const resolvedTarget = (path: string): string => {
  const parent = dirname(path);
  return join(Deno.realPathSync(parent), path.slice(parent.length + 1));
};
/** The resolved root, or the root as given when it does not exist. */
const resolvedRoot = (root: string): string => {
  try {
    return Deno.realPathSync(root);
  } catch {
    return root;
  }
};
/**
 * Refuses net permission that is missing for a grant host, or broader than
 * the grant hosts.
 *
 * @param hosts The live grants' hosts, with any port.
 * @param query How to ask; the real permission query by default.
 * @returns An error message, or undefined when the permission is exact.
 */
export function netPermissionError(
  hosts: readonly string[],
  query: NetPermission = queryNet,
): string | undefined {
  for (const host of hosts) {
    if (query(host) !== "granted") {
      return `--rest: net permission is not granted for ${host}`;
    }
  }
  if (query(SENTINEL_HOST) === "granted") {
    return `--rest: net permission is broader than the grant hosts ` +
      `(${SENTINEL_HOST} is granted); scope --allow-net to ${hosts.join(",")}`;
  }
  return undefined;
}
/** Reads a JSON file, naming it in the error. */
const readJson = (file: string): unknown => {
  try {
    return JSON.parse(Deno.readTextFileSync(file));
  } catch (error) {
    throw new Error(`--rest: cannot read ${file}: ${error}`);
  }
};
/** One grant entry, checked, before any transport exists. */
interface CheckedEntry {
  readonly policy: RestGrantPolicy;
  readonly evidence: string;
  /** `live`, or the fixtures a simulator answers from. */
  readonly transport:
    | "live"
    | { readonly fixtures: Readonly<Record<string, RestFixture>> };
}
/** Checks one entry of the grants file. */
function checkEntry(
  entry: unknown,
  at: (path: string) => string,
  root: string,
): CheckedEntry {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    throw new Error("--rest: each grant must be an object");
  }
  const fields = entry as Record<string, unknown>;
  for (const key of Object.keys(fields)) {
    if (!GRANT_KEYS.has(key)) {
      throw new Error(`--rest: unknown grant key ${key}`);
    }
  }
  let policy: RestGrantPolicy;
  try {
    policy = restGrantPolicy(fields as unknown as RestGrantSpec);
  } catch (error) {
    throw new Error(`--rest: ${(error as Error).message}`);
  }
  const { transport, evidence } = fields;
  if (typeof evidence !== "string" || evidence === "") {
    throw new Error(`--rest: grant ${policy.base} must name evidence`);
  }
  if (typeof transport !== "string" || transport === "") {
    throw new Error(`--rest: grant ${policy.base} must name a transport`);
  }
  const evidencePath = at(evidence);
  Deno.mkdirSync(dirname(evidencePath), { recursive: true });
  if (containsResolved(resolvedRoot(root), resolvedTarget(evidencePath))) {
    throw new Error(
      `--rest: evidence ${evidencePath} lies inside the root binding`,
    );
  }
  return {
    policy,
    evidence: evidencePath,
    transport: transport === "live" ? "live" : {
      fixtures: readJson(at(transport)) as Record<string, RestFixture>,
    },
  };
}
/**
 * Reads `--rest` grants and builds their handler table entries.
 *
 * Every entry is checked, and net permission with it, before any transport
 * starts, so a refused file starts no worker.
 *
 * @param file The grants file.
 * @param root The resolved root binding directory, which evidence must avoid.
 * @param query How to ask about net permission.
 * @returns The installed entries.
 */
export function loadRestConfig(
  file: string,
  root: string,
  query: NetPermission = queryNet,
): RestInstall {
  const config = resolve(file);
  const directory = dirname(config);
  const at = (path: string): string =>
    isAbsolute(path) ? path : resolve(directory, path);
  const entries = readJson(config);
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`--rest: ${file} must hold a non-empty list of grants`);
  }
  const checked = entries.map((entry) => checkEntry(entry, at, root));
  const liveHosts = [
    ...new Set(
      checked
        .filter((entry) => entry.transport === "live")
        .map((entry) => new URL(entry.policy.base).host),
    ),
  ];
  if (liveHosts.length > 0) {
    const refused = netPermissionError(liveHosts, query);
    if (refused !== undefined) throw new Error(refused);
  }
  const live: LiveTransport[] = [];
  const grants = checked.map((entry) => {
    let transport: RestTransport;
    if (entry.transport === "live") {
      const sender = new LiveTransport(entry.policy, entry.evidence);
      live.push(sender);
      transport = sender;
    } else {
      transport = new RestSimulator(
        entry.policy.base,
        entry.transport.fixtures,
        new FileEvidence(entry.evidence),
      );
    }
    return new RestGrant(entry.policy, transport);
  });
  const byScheme = new Map<string, RestGrant[]>();
  for (const grant of grants) {
    const scheme = new URL(grant.base).protocol.slice(0, -1);
    byScheme.set(scheme, [...byScheme.get(scheme) ?? [], grant]);
  }
  const handlers: Record<string, SchemeHandler> = {};
  try {
    for (const [scheme, list] of byScheme) {
      handlers[scheme] = new RestHandler(list);
    }
  } catch (error) {
    live.forEach((sender) => sender.close());
    throw new Error(`--rest: ${(error as Error).message}`);
  }
  return {
    handlers,
    grants,
    close: () => live.forEach((sender) => sender.close()),
  };
}
