import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { attenuateRestPolicy, RestAuthority } from "./rest-authority.ts";
import { restGrantPolicy, type RestInput } from "./rest-policy.ts";
import { RestGrant } from "./rest-handler.ts";
import { MemoryEvidence, RestSimulator } from "./rest-simulator.ts";
const BASE = "https://api.example.com/api/";
const policy = () =>
  restGrantPolicy({
    base: BASE,
    methods: ["GET", "POST", "DELETE"],
    requests: 3,
    requestBytes: 8,
    responseBytes: 100,
    timeoutMs: 1000,
    lifetimeMs: 10000,
  });
const input = (path = "", method = "GET", body?: string): RestInput => ({
  ok: true,
  request: { path, method, body, query: [], headers: [] },
});
describe("REST attenuation and effects", () => {
  it("shares ancestor budgets, revocation and absolute expiry", () => {
    let now = 0;
    const root = new RestAuthority(policy(), () => now);
    const childPolicy = attenuateRestPolicy(root.policy, {
      path: "issues/",
      methods: ["GET"],
      requests: 2,
    });
    const a = new RestAuthority(childPolicy, () => now, "a", root);
    const b = new RestAuthority(childPolicy, () => now, "b", root);
    expect(a.prepare(input("1")).ok).toBe(true);
    expect(b.prepare(input("2")).ok).toBe(true);
    expect(a.prepare(input("3")).ok).toBe(true);
    const fresh = new RestAuthority(childPolicy, () => now, "fresh", root);
    expect(fresh.prepare(input())).toMatchObject({
      ok: false,
      reason: "resource-budget requests",
    });
    root.revoked = true;
    expect(b.prepare(input())).toMatchObject({
      ok: false,
      reason: "resource-revoked",
    });
    root.revoked = false;
    now = 9000;
    const late = new RestAuthority(childPolicy, () => now, "late", root);
    expect(late.expiresAt).toBe(root.expiresAt);
    now = 10001;
    expect(late.prepare(input())).toMatchObject({
      ok: false,
      reason: "resource-budget lifetime",
    });
  });
  it("checks UTF-8 body bytes and allowed method/body combinations before spending", () => {
    const authority = new RestAuthority(policy());
    expect(authority.prepare(input("", "POST", "ééééé"))).toMatchObject({
      reason: "resource-budget request-size",
    });
    expect(authority.prepare(input("", "DELETE", ""))).toMatchObject({
      reason: "resource-request-shape",
    });
    expect(authority.prepare(input("", "TRACE"))).toMatchObject({
      reason: "resource-method-forbidden",
    });
    expect(authority.sent).toBe(0);
    expect(authority.prepare(input("", "POST", "éééé"))).toMatchObject({
      ok: true,
      request: { method: "POST", body: "éééé" },
    });
    expect(authority.sent).toBe(1);
  });
  it("never accepts caller-supplied authority fields", () => {
    const authority = new RestAuthority(policy());
    const forged = {
      ok: true,
      request: { path: "", query: [], headers: [], responseBytes: 99999 },
    } as unknown as RestInput;
    expect(authority.prepare(forged)).toMatchObject({
      reason: "resource-request-shape",
    });
  });
  it("generated chain authorizations are subsets on equal state snapshots", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const rootPolicy = policy();
      const childPolicy = attenuateRestPolicy(rootPolicy, {
        path: `group${seed % 4}/`,
        methods: seed % 2 ? ["GET"] : ["GET", "POST"],
        requests: seed % 4,
        requestBytes: seed % 9,
        responseBytes: seed % 101,
        timeoutMs: seed % 1000 + 1,
      });
      const leafPolicy = attenuateRestPolicy(childPolicy, {
        path: `item${seed % 3}/`,
        requests: seed % 2,
      });
      const root = new RestAuthority(rootPolicy, () => 0);
      const child = new RestAuthority(childPolicy, () => 0, "child", root);
      const leaf = new RestAuthority(leafPolicy, () => 0, "leaf", child);
      const method = seed % 3 ? "GET" : "POST";
      const decision = leaf.prepare(input("1", method));
      if (decision.ok) {
        const parent = new RestAuthority(childPolicy, () => 0);
        const relative = new URL(decision.request.url).pathname.slice(
          new URL(childPolicy.base).pathname.length,
        );
        expect(parent.prepare(input(relative, method)).ok, `seed ${seed}`).toBe(
          true,
        );
        expect(decision.request.responseBytes).toBeLessThanOrEqual(
          rootPolicy.responseBytes,
        );
        expect(decision.request.timeoutMs).toBeLessThanOrEqual(
          childPolicy.timeoutMs,
        );
      }
    }
  });
  it("records effect intent and completion once, with request bytes and no payload", () => {
    const evidence = new MemoryEvidence();
    const simulator = new RestSimulator(BASE, {
      "issues/1": { status: 201, body: "created" },
    }, evidence);
    const root = new RestGrant(policy(), simulator);
    const child = root.attenuate({ path: "issues/", methods: ["POST"] });
    const result = child.exchange(input("1", "POST", "é"));
    expect(result.ok).toBe(true);
    expect(evidence.records.map((record) => record.phase)).toEqual([
      "intent",
      "completion",
    ]);
    expect(evidence.records[0].requestId).toBe(evidence.records[1].requestId);
    expect(evidence.records[0].requestBytes).toBe(2);
    expect(simulator.calls).toHaveLength(1);
    expect(simulator.calls[0]).toMatchObject({
      method: "POST",
      body: "é",
      url: `${BASE}issues/1`,
    });
    expect(JSON.stringify(evidence.records)).not.toContain("é");
    evidence.failing = true;
    expect(child.exchange(input("1", "POST"))).toMatchObject({
      reason: "resource-evidence",
    });
    expect(simulator.calls).toHaveLength(1);
  });
  it("reports uncertainty when a simulated effect loses its response", () => {
    const simulator = new RestSimulator(BASE, {
      "": { status: 200, delayMs: 10000 },
    });
    const grant = new RestGrant(policy(), simulator);
    expect(grant.exchange(input("", "POST"))).toMatchObject({
      ok: false,
      reason: expect.stringMatching(/^resource-effect-uncertain /),
    });
    expect(simulator.calls).toHaveLength(1);
  });
});

describe("REST authority boundary regressions", () => {
  it("rejects escaped attenuation and supports same-base empty-method children", () => {
    expect(() => attenuateRestPolicy(policy(), { path: "../" })).toThrow(
      "REST attenuation",
    );
    const simulator = new RestSimulator(BASE, {});
    const parent = new RestGrant(policy(), simulator);
    const child = parent.attenuate({ methods: ["HEAD"] }, "no-methods");
    expect(child.base).toBe(BASE);
    expect(child.id).toBe("no-methods");
    expect(child.exchange(input())).toMatchObject({
      reason: "resource-method-forbidden",
    });
    expect(parent.requestsSent()).toBe(0);
  });
  it("independently rejects a child policy located outside its ancestor", () => {
    const parent = new RestAuthority(policy());
    const child = new RestAuthority(
      restGrantPolicy({ ...policy(), base: "https://other.example.com/" }),
      Date.now,
      "bad-child",
      parent,
    );
    expect(child.prepare(input())).toMatchObject({
      reason: "resource-escaped-root",
    });
    expect(parent.sent).toBe(0);
  });
  it("delegates live decisions, counts and revocation to one owner", () => {
    let calls = 0;
    let revoked = "";
    const grant = new RestGrant(policy(), {
      describe: () => "remote enforcement",
      send: () => {
        throw new Error("must not send unchecked outgoing data");
      },
      record: () => true,
      authorize: () => {
        calls++;
        return { ok: true, status: 200, body: "ok", headers: {} };
      },
      requestsSent: () => calls,
      revoke: (id) => {
        revoked = id;
      },
    });
    expect(grant.exchange(input()).ok).toBe(true);
    expect(grant.requestsSent()).toBe(1);
    expect(grant.authority.sent).toBe(0);
    grant.revoke();
    expect(revoked).toBe(BASE);
  });
});
