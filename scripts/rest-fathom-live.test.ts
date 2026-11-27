import { expect } from "@std/expect";
import { dirname } from "@std/path";
import {
  fathomFailure,
  fathomLive,
  type FathomRunner,
} from "./rest-fathom-live.ts";
Deno.test("Fathom recording IDs cannot inject a path or program", async () => {
  for (
    const id of [
      "",
      "../123",
      "123/summary",
      "123'; x",
      "https://other.example.com",
    ]
  ) {
    await expect(fathomLive(id, () => {
      throw new Error("runner must not be reached");
    }, () => {})).rejects.toThrow("numeric recording id");
  }
});
Deno.test("Fathom proof requires successful assertions and exactly one authenticated 200", async () => {
  for (
    const scenario of [
      { success: true, statuses: [200], expected: 0 },
      { success: false, statuses: [200], expected: 1 },
      { success: true, statuses: [401], expected: 1 },
      { success: true, statuses: [404], expected: 1 },
      { success: true, statuses: [], expected: 1 },
      { success: true, statuses: [200, 200], expected: 1 },
    ]
  ) {
    let temporary = "";
    const reports: string[] = [];
    const run: FathomRunner = async (args, _cwd) => {
      const configPath = args[args.indexOf("--rest") + 1];
      temporary = dirname(configPath);
      const config = JSON.parse(await Deno.readTextFile(configPath));
      expect(config.install).toEqual(["recording"]);
      expect(config.grants[0].credential).toMatchObject({
        env: "FATHOM_API_KEY",
        scheme: "x-api-key",
      });
      expect(args).toContain("--no-prompt");
      expect(args).toContain("--allow-net=api.fathom.ai");
      await Deno.writeTextFile(
        config.grants[0].evidence,
        scenario.statuses.map((status) =>
          JSON.stringify({ outcome: "sent", status })
        ).join("\n"),
      );
      return { success: scenario.success };
    };
    expect(await fathomLive("123456789", run, (line) => reports.push(line)))
      .toBe(scenario.expected);
    expect(reports.join("\n")).not.toContain("123456789");
    expect(reports.some((line) => line.includes("--env-file=...")))
      .toBe(scenario.statuses.length === 0);
    expect(() => Deno.statSync(temporary)).toThrow();
  }
});
Deno.test("Fathom proof cleans up private temporary files after process failure", async () => {
  let temporary = "";
  const run: FathomRunner = (args) => {
    temporary = dirname(args[args.indexOf("--rest") + 1]);
    throw new Error("launch failed");
  };
  await expect(fathomLive("123456789", run, () => {})).rejects.toThrow(
    "launch failed",
  );
  expect(() => Deno.statSync(temporary)).toThrow();
});

Deno.test("Fathom launch failures distinguish usage and permissions without private error text", async () => {
  try {
    await fathomLive("bad", undefined, () => {});
  } catch (error) {
    expect(fathomFailure(error)).toContain("Usage:");
  }
  expect(fathomFailure(new Error("private-path-or-content")))
    .not.toContain("private-path-or-content");
  const child = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-prompt",
      "--allow-read",
      "--allow-write",
      "scripts/rest-fathom-live.ts",
      "123456",
    ],
    cwd: new URL("../", import.meta.url),
    stdout: "piped",
    stderr: "piped",
  }).output();
  const error = new TextDecoder().decode(child.stderr);
  expect(child.code).toBe(1);
  expect(error).toContain("launcher permission denied");
  expect(error).not.toContain("Usage:");
  expect(error).not.toContain("123456");
});
