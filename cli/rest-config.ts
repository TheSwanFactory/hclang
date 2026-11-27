/**
 * REST config validation, diagnostics and installation. Definitions are checked
 * without side effects; only installed grants and their ancestors get transports.
 * Live roots start scoped workers before credential env access is revoked in the
 * evaluator isolate. Policy and mutable state are authoritative in the worker.
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
import { VISIBLE_ENVIRONMENT } from "../lib/execute/env-visibility.ts";
import {
  attenuateRestPolicy,
  type RestNarrowing,
} from "../lib/frames/rest-authority.ts";
import { LiveTransport } from "./rest-worker.ts";
/** A host no grant names; net permission for it means the flag is too broad. */
export const SENTINEL_HOST = "example.invalid";
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
/** A root's human-facing credential declaration; never holds a value. */
export interface RestCredential {
  readonly env: string;
  readonly scheme: "bearer";
  readonly create: string;
  readonly permissions: string;
}
interface Definition {
  readonly id: string;
  readonly policy: RestGrantPolicy;
  readonly parent?: string;
  readonly root: string;
  readonly transport?: string;
  readonly evidence?: string;
  readonly credential?: RestCredential;
}
/** Validated definitions and selected authority, without starting transports. */
export interface RestConfig {
  readonly definitions: readonly Definition[];
  readonly install: readonly string[];
}
const ROOT_KEYS = new Set([
  "id",
  "base",
  "methods",
  "requestBytes",
  "requests",
  "responseBytes",
  "timeoutMs",
  "lifetimeMs",
  "evidence",
  "transport",
  "requestHeaders",
  "responseHeaders",
  "credential",
]);
const CHILD_KEYS = new Set([
  "id",
  "attenuates",
  "path",
  "methods",
  "requestBytes",
  "requests",
  "responseBytes",
  "timeoutMs",
  "lifetimeMs",
  "requestHeaders",
  "responseHeaders",
]);
const object = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("--rest: each grant must be an object");
  }
  return value as Record<string, unknown>;
};
/** Parses and validates without mkdir, worker startup, network or evidence writes. */
export function readRestConfig(file: string): RestConfig {
  const config = readJson(resolve(file));
  let entries: unknown[];
  let install: unknown;
  if (Array.isArray(config)) {
    entries = config;
    install = entries.map((entry) => object(entry).id ?? object(entry).base);
  } else {
    const record = object(config);
    if (
      Object.keys(record).some((key) => !["grants", "install"].includes(key))
    ) throw new Error("--rest: unknown config key");
    entries = record.grants as unknown[];
    install = record.install;
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("--rest: expected non-empty list of grants");
  }
  if (
    !Array.isArray(install) || install.some((id) => typeof id !== "string") ||
    new Set(install).size !== install.length
  ) throw new Error("--rest: install must contain distinct grant ids");
  const raw = new Map<string, Record<string, unknown>>();
  for (const entry of entries) {
    const fields = object(entry);
    const id = fields.id ?? fields.base;
    if (typeof id !== "string" || !id) {
      throw new Error("--rest: each grant must name an id");
    }
    if (raw.has(id)) {
      throw new Error("--rest: grants must have distinct bases or ids");
    }
    const allowed = fields.attenuates === undefined ? ROOT_KEYS : CHILD_KEYS;
    for (const key of Object.keys(fields)) {
      if (!allowed.has(key)) {
        throw new Error(`--rest: unknown grant key ${key}`);
      }
    }
    raw.set(id, fields);
  }
  const checked = new Map<string, Definition>();
  const active = new Set<string>();
  const visit = (id: string): Definition => {
    const existing = checked.get(id);
    if (existing) return existing;
    if (active.has(id)) throw new Error(`--rest: attenuation cycle at ${id}`);
    const fields = raw.get(id);
    if (!fields) throw new Error(`--rest: unknown grant id ${id}`);
    active.add(id);
    let definition: Definition;
    if (fields.attenuates !== undefined) {
      if (typeof fields.attenuates !== "string") {
        throw new Error("--rest: attenuates must name an id");
      }
      const parent = visit(fields.attenuates);
      const { id: _id, attenuates: _parent, ...narrow } = fields;
      definition = {
        id,
        parent: parent.id,
        root: parent.root,
        policy: attenuateRestPolicy(parent.policy, narrow as RestNarrowing),
      };
    } else {
      const policy = restGrantPolicy(fields as unknown as RestGrantSpec);
      if (typeof fields.transport !== "string" || !fields.transport) {
        throw new Error(`--rest: grant ${id} must name a transport`);
      }
      if (typeof fields.evidence !== "string" || !fields.evidence) {
        throw new Error(`--rest: grant ${id} must name evidence`);
      }
      let credential: RestCredential | undefined;
      if (fields.credential !== undefined) {
        const value = object(fields.credential);
        if (
          Object.keys(value).some((key) =>
            !["env", "scheme", "create", "permissions"].includes(key)
          ) ||
          typeof value.env !== "string" || !/^HC_[A-Z0-9_]+$/.test(value.env) ||
          VISIBLE_ENVIRONMENT.includes(value.env) ||
          value.scheme !== "bearer" || typeof value.create !== "string" ||
          typeof value.permissions !== "string"
        ) {
          throw new Error(
            "--rest: invalid or HC-visible credential declaration",
          );
        }
        credential = value as unknown as RestCredential;
      }
      definition = {
        id,
        root: id,
        policy,
        transport: fields.transport,
        evidence: fields.evidence,
        credential,
      };
    }
    active.delete(id);
    checked.set(id, definition);
    return definition;
  };
  for (const id of raw.keys()) visit(id);
  const bases = new Set<string>();
  for (const id of install as string[]) {
    const definition = visit(id);
    if (bases.has(definition.policy.base)) {
      throw new Error("--rest: installed grants must have distinct bases");
    }
    bases.add(definition.policy.base);
  }
  return { definitions: [...checked.values()], install: install as string[] };
}
/** Human-facing diagnostics only. A denied env inspection does not imply absence. */
export function describeRestConfig(
  config: RestConfig,
  availability?: ReadonlyMap<string, boolean>,
): string {
  const byId = new Map(
    config.definitions.map((definition) => [definition.id, definition]),
  );
  return config.install.map((id) => {
    const entry = byId.get(id)!;
    const root = byId.get(entry.root)!;
    const { policy } = entry;
    const lines = [
      `${id}: ${policy.base}`,
      `  methods: ${policy.methods.join(", ") || "none"}`,
      `  requests: ${policy.requests}, requestBytes: ${policy.requestBytes}, responseBytes: ${policy.responseBytes}`,
      `  timeoutMs: ${policy.timeoutMs}, lifetimeMs: ${policy.lifetimeMs}`,
    ];
    const ancestry: string[] = [];
    for (let parent = entry.parent; parent; parent = byId.get(parent)?.parent) {
      ancestry.push(parent);
    }
    lines.push(`  ancestry: ${ancestry.join(" -> ") || "root"}`);
    if (root.credential) {
      const credential = root.credential;
      let status: string;
      if (availability !== undefined) {
        status = availability.get(root.id) ? "set" : "unset or unavailable";
      } else if (
        Deno.permissions.querySync({ name: "env", variable: credential.env })
          .state === "granted"
      ) {
        status = Deno.env.has(credential.env) ? "set" : "unset";
      } else {
        status = "not permitted to inspect";
      }
      lines.push(
        `  ${credential.env}: ${status}`,
        `  create: ${credential.create}`,
        `  permissions: ${credential.permissions}`,
        `  export ${credential.env} with a new token, or put it in .env and use Deno --env-file=.env before cli/hc.ts.`,
        `  ${credential.env}=$(gh auth token) reuses an existing credential; its scope is not established by these instructions.`,
      );
    }
    return lines.join("\n");
  }).join("\n\n");
}
/** Loads only the installed ancestor closure; the worker owns live authorization. */
export function loadRestConfig(
  file: string,
  root: string,
  query: NetPermission = queryNet,
): RestInstall {
  const config = readRestConfig(file);
  const directory = dirname(resolve(file));
  const at = (path: string): string =>
    isAbsolute(path) ? path : resolve(directory, path);
  const byId = new Map(config.definitions.map((entry) => [entry.id, entry]));
  const required = new Set<string>();
  for (const id of config.install) {
    let entry: Definition | undefined = byId.get(id);
    while (entry) {
      required.add(entry.id);
      entry = entry.parent ? byId.get(entry.parent) : undefined;
    }
  }
  const selected = config.definitions.filter((entry) => required.has(entry.id));
  const roots = selected.filter((entry) => entry.root === entry.id);
  const liveRoots = roots.filter((entry) => entry.transport === "live");
  if (liveRoots.length) {
    const error = netPermissionError([
      ...new Set(liveRoots.map((entry) => new URL(entry.policy.base).host)),
    ], query);
    if (error) throw new Error(error);
  }
  const transports = new Map<string, RestTransport>();
  const live: LiveTransport[] = [];
  try {
    for (const entry of roots) {
      const evidence = at(entry.evidence!);
      Deno.mkdirSync(dirname(evidence), { recursive: true });
      if (containsResolved(resolvedRoot(root), resolvedTarget(evidence))) {
        throw new Error(
          `--rest: evidence ${evidence} lies inside the root binding`,
        );
      }
      let transport: RestTransport;
      if (entry.transport === "live") {
        const sender = new LiveTransport(entry.policy, evidence, undefined, {
          credentialEnv: entry.credential?.env,
          definitions: selected.filter((node) => node.root === entry.id).map((
            node,
          ) => ({
            id: node.id,
            policy: node.policy,
            parent: node.parent,
            installed: config.install.includes(node.id),
          })),
        });
        live.push(sender);
        transport = sender;
      } else {
        transport = new RestSimulator(
          entry.policy.base,
          readJson(at(entry.transport!)) as Record<string, RestFixture>,
          new FileEvidence(evidence),
        );
      }
      transports.set(entry.id, transport);
    }
    const variables = new Set(
      liveRoots.flatMap((entry) =>
        entry.credential ? [entry.credential.env] : []
      ),
    );
    for (const variable of variables) {
      Deno.permissions.revokeSync({ name: "env", variable });
      if (
        Deno.permissions.querySync({ name: "env", variable }).state ===
          "granted"
      ) {
        throw new Error(
          `--rest: credential ${variable} remains accessible; use a scoped --allow-env list`,
        );
      }
    }
    const availability = new Map(
      liveRoots.map((entry, i) => [entry.id, live[i].ready()]),
    );
    for (let i = 0; i < live.length; i++) {
      if (!availability.get(liveRoots[i].id)) {
        throw new Error(
          `--rest: required credential ${
            liveRoots[i].credential?.env
          } is unset or unavailable\n${
            describeRestConfig(config, availability)
          }`,
        );
      }
    }
    const constructed = new Map<string, RestGrant>();
    for (const entry of selected) {
      constructed.set(
        entry.id,
        new RestGrant(
          entry.policy,
          transports.get(entry.root)!,
          Date.now,
          entry.id,
          entry.parent ? constructed.get(entry.parent) : undefined,
        ),
      );
    }
    const grants = config.install.map((id) => constructed.get(id)!);
    const byScheme = new Map<string, RestGrant[]>();
    for (const grant of grants) {
      const scheme = new URL(grant.base).protocol.slice(0, -1);
      byScheme.set(scheme, [...byScheme.get(scheme) ?? [], grant]);
    }
    const handlers: Record<string, SchemeHandler> = {};
    for (const [scheme, entries] of byScheme) {
      handlers[scheme] = new RestHandler(entries);
    }
    return {
      handlers,
      grants,
      close: () => live.forEach((sender) => sender.close()),
    };
  } catch (error) {
    live.forEach((sender) => sender.close());
    throw error;
  }
}
