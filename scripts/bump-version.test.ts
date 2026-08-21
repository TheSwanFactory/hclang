import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { nextVersion, wantsMinor } from "./bump-version.ts";

describe("nextVersion", () => {
  it("bumps the patch by default", () => {
    expect(nextVersion("0.10.5", false)).toEqual("0.10.6");
    expect(nextVersion("1.0.0", false)).toEqual("1.0.1");
  });

  it("bumps the minor and resets the patch when asked", () => {
    // `deno task bump --minor` used to hand `--minor` to `git commit` at the end
    // of a `&&` chain and bump the patch in silence. This is the version the
    // flag has to produce.
    expect(nextVersion("0.10.5", true)).toEqual("0.11.0");
    expect(nextVersion("1.2.3", true)).toEqual("1.3.0");
  });

  it("carries a two-digit component without string comparison", () => {
    expect(nextVersion("0.9.9", false)).toEqual("0.9.10");
    expect(nextVersion("0.9.9", true)).toEqual("0.10.0");
  });

  it("refuses a version it cannot recognize", () => {
    for (const version of ["0.10", "0.10.5.1", "v0.10.5", "0.10.x", ""]) {
      expect(() => nextVersion(version, false)).toThrow(
        `Unrecognized version: ${version}`,
      );
    }
  });
});

describe("wantsMinor", () => {
  it("reads the one supported flag", () => {
    expect(wantsMinor([])).toBe(false);
    expect(wantsMinor(["--minor"])).toBe(true);
  });

  it("rejects an argument instead of ignoring it", () => {
    // Silently ignoring an argument is how the original bug hid: the flag went
    // somewhere it had no meaning and the bump looked like it had worked.
    expect(() => wantsMinor(["--major"])).toThrow(
      "Unsupported argument: --major",
    );
    expect(() => wantsMinor(["--minor", "0.11.0"])).toThrow(
      "Unsupported argument: 0.11.0",
    );
  });

  it("names every unsupported argument at once", () => {
    expect(() => wantsMinor(["--major", "--patch"])).toThrow(
      "Unsupported argument: --major --patch",
    );
  });

  it("shows usage alongside the rejection", () => {
    expect(() => wantsMinor(["--major"])).toThrow(
      "Usage: deno task bump [--minor]",
    );
  });
});
