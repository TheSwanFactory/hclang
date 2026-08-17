import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { graphModuleError, missingPackagePin } from "./build-hcweb.ts";

/** A resolved graph pins each package by identifier or by module path. */
const graphFor = (hcweb: string, hclang: string): string =>
  JSON.stringify({
    modules: [
      { specifier: `https://jsr.io/@swanfactory/hcweb/${hcweb}/mount.ts` },
      { specifier: `https://jsr.io/@swanfactory/hclang/${hclang}/mod.ts` },
    ],
    packages: {
      "@swanfactory/hcweb": `@swanfactory/hcweb@${hcweb}`,
      "@swanfactory/hclang": `@swanfactory/hclang@${hclang}`,
    },
  });

describe("missingPackagePin", () => {
  it("accepts a graph pinned to the released version", () => {
    expect(missingPackagePin(graphFor("0.9.3", "0.9.3"), "0.9.3"))
      .toBeUndefined();
  });

  it("reports a dependency left behind by registry propagation", () => {
    expect(missingPackagePin(graphFor("0.9.2", "0.9.1"), "0.9.2"))
      .toEqual("@swanfactory/hclang@0.9.2");
  });

  it("reports the released package itself when it is unresolved", () => {
    expect(missingPackagePin(graphFor("0.9.1", "0.9.2"), "0.9.2"))
      .toEqual("@swanfactory/hcweb@0.9.2");
  });

  it("does not accept a longer version as a prefix match", () => {
    expect(missingPackagePin(graphFor("0.9.30", "0.9.30"), "0.9.3"))
      .toEqual("@swanfactory/hcweb@0.9.3");
  });

  it("accepts a pin followed by a module path or delimiter", () => {
    const graph = [
      '"https://jsr.io/@swanfactory/hcweb/0.9.3/mount.ts"',
      '"@swanfactory/hclang@0.9.3"',
    ].join(",");

    expect(missingPackagePin(graph, "0.9.3")).toBeUndefined();
  });
});

describe("graphModuleError", () => {
  it("accepts a graph that resolved every module", () => {
    expect(graphModuleError(graphFor("0.9.4", "0.9.4"))).toBeUndefined();
  });

  it("surfaces a resolution error that deno info recorded instead of raising", () => {
    const graph = JSON.stringify({
      modules: [
        { specifier: "file:///tmp/entry.ts" },
        {
          specifier: "jsr:@swanfactory/hcweb@0.9.4/mount",
          error:
            "Could not find version of '@swanfactory/hcweb' that matches specified version constraint '0.9.4'",
        },
      ],
    });

    expect(graphModuleError(graph)).toEqual(
      "jsr:@swanfactory/hcweb@0.9.4/mount: Could not find version of " +
        "'@swanfactory/hcweb' that matches specified version constraint '0.9.4'",
    );
  });

  it("reports unparsable output rather than treating it as resolved", () => {
    expect(graphModuleError("not json")).toEqual(
      "release graph was not valid JSON",
    );
  });
});
