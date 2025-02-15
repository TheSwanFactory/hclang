import { expect } from "jsr:@std/expect";

const hc_bin = "src/cli/hc.ts";

const script = async (args: string[]) => {
  const argv = ["deno", "run", "--allow-all", hc_bin, ...args];
  console.debug("script", argv);
  const cmd = new Deno.Command(
    Deno.execPath(),
    {
      args: argv,
      stdout: "piped",
      stderr: "piped",
    },
  );

  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    const result = new TextDecoder().decode(stderr);
    console.error(result);
    return [`Failed[${code}] to run ${hc_bin}: ${args.join(" ")}`];
  }
  const result = new TextDecoder("utf-8").decode(stdout);
  return result.trim().split("\n");
};

Deno.test("123 + 654", async (t) => {
  const result = await script(["-e", t.name]);
  expect(result[0]).to.equal("777");
});

Deno.test("“Hello, Quine!”", async (t) => {
  const result = await script(["-e", t.name]);
  expect(result[0]).to.equal(t.name);
});
