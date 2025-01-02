import { expect } from "chai";
import { execFileSync } from "node:child_process";
import { describe, it } from "jsr:@std/testing/bdd";

describe("script", () => {
  const hc_bin = "lib/src/cli/hc.ts";

  const script = (args: string[]) => {
    const result = execFileSync(hc_bin, args);
    return result.toString().split("\n");
  };

  it("123 + 654", (t: Deno.TestContext) => {
    const result = script(["-e", t.name]);
    expect(result[0]).to.equal("777");
  });

  it("“Hello, Quine!”", (t: Deno.TestContext) => {
    const result = script(["-e", t.name]);
    expect(result[0]).to.equal(t.name);
  });
});
