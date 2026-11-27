import { CLI_ENVIRONMENT } from "./env-permissions.ts";
import { expect } from "@std/expect";
import { dirname } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import {
  describeRestConfig,
  loadRestConfig,
  type NetPermission,
  netPermissionError,
  readRestConfig,
  SENTINEL_HOST,
} from "./rest-config.ts";
import { getEval, getOptions, main } from "./hc.ts";
import { FrameArray } from "../lib/frames.ts";
const BASE = "https://api.github.com/repos/TheSwanFactory/hclang/";
const exact: NetPermission = (host) =>
  host === "api.github.com" ? "granted" : "prompt";
const everything: NetPermission = () => "granted";
const nothing: NetPermission = () => "prompt";
/** Writes a grants file and its fixtures into a fresh directory. */
const setup = (grants: unknown[]) => {
  const directory = Deno.makeTempDirSync({ prefix: "hc-rest-config-" });
  Deno.writeTextFileSync(
    `${directory}/fixtures.json`,
    JSON.stringify({ "": { status: 200, body: "{}" } }),
  );
  const file = `${directory}/grants.json`;
  Deno.writeTextFileSync(file, JSON.stringify(grants));
  return { directory, file };
};
const grant = (overrides: Record<string, unknown> = {}) => ({
  base: BASE,
  transport: "fixtures.json",
  requests: 2,
  responseBytes: 100,
  timeoutMs: 100,
  lifetimeMs: 1_000,
  evidence: "evidence.jsonl",
  ...overrides,
});
describe("--rest startup", () => {
  it("accepts net permission exactly for the grant hosts", () => {
    expect(netPermissionError(["api.github.com"], exact)).toEqual(undefined);
  });
  it("refuses missing or broader net permission", () => {
    expect(netPermissionError(["api.github.com"], nothing)).toContain(
      "not granted for api.github.com",
    );
    expect(netPermissionError(["api.github.com"], everything)).toContain(
      `${SENTINEL_HOST} is granted`,
    );
  });
  it("checks net permission only for live grants", () => {
    const { file } = setup([grant()]);
    expect(loadRestConfig(file, "/nonexistent-root", everything).grants)
      .toHaveLength(1);
    const live = setup([grant({ transport: "live" })]);
    expect(() => loadRestConfig(live.file, "/nonexistent-root", everything))
      .toThrow("broader than the grant hosts");
    expect(() => loadRestConfig(live.file, "/nonexistent-root", nothing))
      .toThrow("not granted");
  });
  it("refuses evidence inside the root binding", () => {
    const { directory, file } = setup([grant()]);
    expect(() => loadRestConfig(file, directory, exact)).toThrow(
      "inside the root binding",
    );
  });
  it("refuses a bad grant, an unknown key, or a repeated base", () => {
    const refused = (grants: unknown[]) => () =>
      loadRestConfig(setup(grants).file, "/nonexistent-root", exact);
    expect(refused([])).toThrow("non-empty list");
    expect(refused([grant({ base: "https://api.github.com/x" })])).toThrow(
      "end with a slash",
    );
    expect(refused([grant({ method: "POST" })])).toThrow("unknown grant key");
    expect(refused([grant({ requestHeaders: ["authorization"] })])).toThrow(
      "may not allow",
    );
    expect(refused([grant({ evidence: "" })])).toThrow("must name evidence");
    expect(refused([grant(), grant()])).toThrow("distinct grant");
    expect(refused(["not an object"])).toThrow("must be an object");
    expect(refused([grant({ transport: "" })])).toThrow(
      "must name a transport",
    );
  });
  it("accepts an absolute evidence path, and fails closed when it cannot append", async () => {
    const { directory } = setup([]);
    Deno.mkdirSync(`${directory}/blocked.jsonl`);
    const file = setup([grant({ evidence: `${directory}/blocked.jsonl` })])
      .file;
    const out = new FrameArray([]);
    await main(
      getEval({}, out, file),
      getOptions(["-e", `'${BASE}' []`]),
    );
    expect(out.at(-1).toString()).toContain("$!.resource-evidence");
  });
  it("installs simulated grants for the CLI, and reports refusals", async () => {
    const { file, directory } = setup([grant()]);
    const out = new FrameArray([]);
    await main(
      getEval({}, out, file),
      getOptions(["-e", `['${BASE}' [], '${BASE}' [.path “..”]]`]),
    );
    expect(out.at(-1).toString()).toContain(".status 200");
    expect(out.at(-1).toString()).toContain("$!.resource-parent-escape");
    const records = Deno.readTextFileSync(`${directory}/evidence.jsonl`)
      .trim().split("\n");
    expect(records).toHaveLength(2);
    expect(() => getEval({}, undefined, `${directory}/absent.json`)).toThrow(
      "cannot read",
    );
  });
});

/** Writes a new-format config next to the fixture. */
const graph = (value: unknown) => {
  const result = setup([]);
  Deno.writeTextFileSync(result.file, JSON.stringify(value));
  return result;
};
describe("REST grant definitions and installation", () => {
  it("installs only a selected child, including same-base narrowing", () => {
    const { file } = graph({
      grants: [
        grant({ id: "root", methods: ["GET", "POST"], requestBytes: 10 }),
        { id: "child", attenuates: "root", methods: ["GET"] },
      ],
      install: ["child"],
    });
    const installed = loadRestConfig(file, "/nonexistent-root");
    expect(installed.grants).toHaveLength(1);
    expect(installed.grants[0].base).toBe(BASE);
    expect(installed.grants[0].policy.methods).toEqual(["GET"]);
  });
  it("does not demand permissions or evidence for unused live roots", () => {
    const { file } = graph({
      grants: [
        grant({ id: "public" }),
        grant({
          id: "private",
          base: "https://private.example.com/",
          transport: "live",
          evidence: "/forbidden/unused.jsonl",
          credential: {
            env: "HC_UNUSED_TOKEN",
            scheme: "bearer",
            create: "https://example.com/token",
            permissions: "read",
          },
        }),
      ],
      install: ["public"],
    });
    expect(loadRestConfig(file, "/nonexistent-root", nothing).grants)
      .toHaveLength(1);
  });
  it("preflight has no evidence side effects and reports selected credentials", () => {
    const { file, directory } = graph({
      grants: [
        grant({
          id: "root",
          transport: "live",
          evidence: "not-created/evidence.jsonl",
          credential: {
            env: "HC_UNSET_PREFLIGHT",
            scheme: "bearer",
            create: "https://example.com/token",
            permissions: "read",
          },
        }),
        { id: "child", attenuates: "root", path: "issues/" },
      ],
      install: ["child"],
    });
    const text = describeRestConfig(readRestConfig(file));
    expect(text).toContain("child:");
    expect(text).toContain("HC_UNSET_PREFLIGHT: unset");
    expect(text).toContain("ancestry: root");
    expect(() => Deno.statSync(`${directory}/not-created`)).toThrow();
  });
  it("rejects cycles, unknown ids, duplicate exports and child credentials", () => {
    for (
      const config of [
        { grants: [grant({ id: "root" })], install: ["absent"] },
        {
          grants: [{ id: "a", attenuates: "b" }, { id: "b", attenuates: "a" }],
          install: ["a"],
        },
        {
          grants: [grant({ id: "root" }), {
            id: "child",
            attenuates: "root",
            credential: {},
          }],
          install: ["child"],
        },
        {
          grants: [grant({ id: "root" }), { id: "child", attenuates: "root" }],
          install: ["root", "child"],
        },
      ]
    ) expect(() => readRestConfig(graph(config).file)).toThrow();
  });
});

Deno.test("hc:rest-auth scopes env to CLI dependencies and selected credentials", () => {
  const project = JSON.parse(
    Deno.readTextFileSync(new URL("../deno.json", import.meta.url)),
  );
  const task: string = project.tasks["hc:rest-auth"];
  const configured = task.match(/--allow-env=([^ ]+)/)![1].split(",").sort();
  expect(configured).toEqual(
    [...CLI_ENVIRONMENT, "HC_GITHUB_TOKEN"].sort(),
  );
  expect(task).toContain("--unstable-worker-options");
  expect(task).toContain("--no-prompt");
  expect(task).toContain("--rest cli/rest/github-auth.json");
});

describe("REST config validation boundaries", () => {
  it("rejects malformed graph structure and credential declarations", () => {
    const credential = {
      env: "HC_TEST_VALID",
      scheme: "bearer",
      create: "https://example.com/token",
      permissions: "read",
    };
    const invalid: unknown[] = [
      { unexpected: true },
      { grants: "bad", install: [] },
      { grants: [grant({ id: "r" })], install: null },
      { grants: [grant({ id: "r" })], install: ["r", "r"] },
      { grants: [grant({ id: 1 })], install: [] },
      {
        grants: [
          grant({ id: "r" }),
          grant({ id: "r", base: "https://other.example.com/" }),
        ],
        install: [],
      },
      {
        grants: [grant({ id: "r" }), { id: "c", attenuates: 1 }],
        install: ["c"],
      },
      {
        grants: [grant({ id: "r" }), { id: "c", attenuates: "missing" }],
        install: ["c"],
      },
      ...[
        { extra: "bad" },
        { env: "PATH" },
        { env: 1 },
        { scheme: "basic" },
        { create: 1 },
        { permissions: 1 },
      ].map((change) => ({
        grants: [grant({ id: "r", credential: { ...credential, ...change } })],
        install: ["r"],
      })),
      { grants: [grant({ id: "r", methods: ["TRACE"] })], install: [] },
      { grants: [grant({ id: "r", requestBytes: -1 })], install: [] },
    ];
    for (const config of invalid) {
      const { file, directory } = graph(config);
      try {
        expect(() => readRestConfig(file), JSON.stringify(config)).toThrow();
      } finally {
        Deno.removeSync(directory, { recursive: true });
      }
    }
  });
  it("can install an empty selection without initializing any root", () => {
    const { file } = graph({
      grants: [grant({ id: "r", transport: "live" })],
      install: [],
    });
    const install = loadRestConfig(file, "/nonexistent-root", nothing);
    expect(install.grants).toEqual([]);
    expect(install.handlers).toEqual({});
    install.close();
  });
  it("reports credential availability without printing its value", () => {
    Deno.env.set("HC_REST_PREFLIGHT_SET", "fake-sensitive-value");
    const { file, directory } = graph({
      grants: [
        grant({
          id: "r",
          credential: {
            env: "HC_REST_PREFLIGHT_SET",
            scheme: "bearer",
            create: "https://example.com/token",
            permissions: "read",
          },
        }),
      ],
      install: ["r"],
    });
    try {
      const result = describeRestConfig(readRestConfig(file));
      expect(result).toContain("HC_REST_PREFLIGHT_SET: set");
      expect(result).not.toContain("fake-sensitive-value");
    } finally {
      Deno.env.delete("HC_REST_PREFLIGHT_SET");
      Deno.removeSync(directory, { recursive: true });
    }
  });
  it("runs preflight before evaluation and without write or network permission", async () => {
    const { file, directory } = graph({
      grants: [grant({
        id: "r",
        transport: "live",
        evidence: "untouched/evidence.jsonl",
        credential: {
          env: "HC_REST_NO_INSPECTION",
          scheme: "bearer",
          create: "https://example.com/token",
          permissions: "read",
        },
      })],
      install: ["r"],
    });
    try {
      const cli = new URL("./hc.ts", import.meta.url).pathname;
      const command = async (
        args: string[],
        allowWrite = false,
      ): Promise<{ code: number; output: string }> => {
        const result = await new Deno.Command(Deno.execPath(), {
          args: [
            "run",
            "--allow-read",
            ...(allowWrite ? [`--allow-write=${dirname(directory)}`] : []),
            `--allow-env=${CLI_ENVIRONMENT.join(",")}`,
            "--no-prompt",
            cli,
            ...args,
          ],
          stdout: "piped",
          stderr: "piped",
        }).output();
        return {
          code: result.code,
          output: new TextDecoder().decode(result.stdout) +
            new TextDecoder().decode(result.stderr),
        };
      };
      const success = await command([
        "--rest",
        file,
        "--grants",
        "--evaluate",
        "a-name-that-must-not-run",
      ]);
      expect(success.code, success.output).toBe(0);
      expect(success.output).toContain("not permitted to inspect");
      expect(success.output).not.toContain("name-missing");
      expect(() => Deno.statSync(`${directory}/untouched`)).toThrow();
      expect((await command(["--grants"])).code).toBe(1);
      // Normal startup must fail before evaluation when its grants cannot load.
      // Give this launch temp-root write access so it reaches the REST failure.
      const missing = await command([
        "--rest",
        `${directory}/missing.json`,
        "--evaluate",
        "1",
      ], true);
      expect(missing.code, missing.output).toBe(1);
      expect(missing.output).toContain("--rest: cannot read");
      expect(missing.output).toContain("missing.json");
      expect(missing.output).not.toContain("Requires write access");
    } finally {
      Deno.removeSync(directory, { recursive: true });
    }
  });
});

Deno.test("preflight explains an installed grant with no allowed methods", () => {
  const { file, directory } = graph({
    grants: [grant({ id: "empty", methods: [] })],
    install: ["empty"],
  });
  try {
    expect(describeRestConfig(readRestConfig(file))).toContain("methods: none");
  } finally {
    Deno.removeSync(directory, { recursive: true });
  }
});

Deno.test("post-revocation diagnostics use worker reports without probing env", () => {
  const { file, directory } = graph({
    grants: [
      grant({
        id: "r",
        credential: {
          env: "HC_REST_STATUS",
          scheme: "bearer",
          create: "https://example.com/token",
          permissions: "read",
        },
      }),
    ],
    install: ["r"],
  });
  const has = Deno.env.has;
  Deno.env.has = (): boolean => {
    throw new Error("must not re-read credential status");
  };
  try {
    const config = readRestConfig(file);
    expect(describeRestConfig(config, new Map([["r", false]]))).toContain(
      "HC_REST_STATUS: unset or unavailable",
    );
    expect(describeRestConfig(config, new Map([["r", true]]))).toContain(
      "HC_REST_STATUS: set",
    );
  } finally {
    Deno.env.has = has;
    Deno.removeSync(directory, { recursive: true });
  }
});
