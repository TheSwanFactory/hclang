import { expect } from "@std/expect";
import { dirname } from "@std/path";
import { fathomLive, type FathomRunner } from "./rest-fathom-live.ts";
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
