import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import {
  loadRestConfig,
  type NetPermission,
  netPermissionError,
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
    expect(refused([grant(), grant()])).toThrow("distinct bases");
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
