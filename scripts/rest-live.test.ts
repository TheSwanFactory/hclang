import { expect } from "@std/expect";
import { type LiveCorpus, type LiveRun, runLiveChecks } from "./rest-live.ts";
Deno.test("missing credentials preserve public coverage and explicitly skip only auth", async () => {
  const calls: LiveCorpus[] = [];
  const reports: string[] = [];
  const code = await runLiveChecks(false, (corpus) => {
    calls.push(corpus);
    return Promise.resolve({ code: 0, output: "", records: [] });
  }, (line) => reports.push(line));
  expect(code).toBe(0);
  expect(calls.map((call) => call.source)).toEqual(["hc/rest.hc"]);
  expect(reports.some((line) => line.includes("authenticated skipped"))).toBe(
    true,
  );
  expect(
    reports.some((line) =>
      line.includes("authenticated") && line.includes("passed")
    ),
  ).toBe(false);
});
Deno.test("auth 401/403 fails even when another request encounters transport failure", async () => {
  for (const status of [401, 403]) {
    const calls: string[] = [];
    const reports: string[] = [];
    const code = await runLiveChecks(true, (corpus) => {
      calls.push(corpus.name);
      return Promise.resolve(
        corpus.name === "public" ? { code: 0, output: "", records: [] } : {
          code: 1,
          output: "test-fail",
          records: [{ status, refusal: null }, {
            status: null,
            refusal: "resource-transport timeout",
          }],
        },
      );
    }, (line) => reports.push(line));
    expect(code).toBe(1);
    expect(calls).toEqual(["public", "authenticated"]);
    expect(
      reports.some((line) =>
        line.includes("authenticated") && line.includes("failed")
      ),
    ).toBe(true);
    expect(reports.some((line) => line.includes("authenticated skipped"))).toBe(
      false,
    );
  }
});
Deno.test("live corpora distinguish rate limits, unavailability and actual assertion failures", async () => {
  const scenarios: { run: LiveRun; expected: number }[] = [
    {
      run: { code: 1, output: "", records: [{ status: 429, refusal: null }] },
      expected: 0,
    },
    {
      run: {
        code: 1,
        output: "",
        records: [{ status: null, refusal: "resource-transport" }],
      },
      expected: 0,
    },
    {
      run: { code: 1, output: "", records: [{ status: 500, refusal: null }] },
      expected: 1,
    },
    { run: { code: 1, output: "", records: [] }, expected: 1 },
    {
      run: {
        code: 0,
        output: "test-summary",
        records: [{ status: 200, refusal: null }],
      },
      expected: 0,
    },
  ];
  for (const { run, expected } of scenarios) {
    expect(await runLiveChecks(true, () => Promise.resolve(run), () => {}))
      .toBe(expected);
  }
  expect(
    await runLiveChecks(false, () =>
      Promise.resolve({
        code: 1,
        output: "",
        records: [{ status: 403, refusal: null }],
      }), () => {}),
  ).toBe(0);
});
