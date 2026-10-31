import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { checkEmbed, hcFiles, hcKey, renderEmbed } from "./embed-hc.ts";

/** Evaluates a rendered embed without writing it, so no permission is needed. */
const importEmbed = async (
  text: string,
): Promise<ReadonlyMap<string, string>> => {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  const rendered = await import(
    `data:application/typescript;base64,${btoa(binary)}`
  );
  return rendered.HC_SOURCES;
};

describe("hcFiles", () => {
  it("keeps only the HC files, sorted", () => {
    expect(
      hcFiles([
        "b.hc",
        "apply-tutorial.md",
        "figures.hc",
        "README",
        "a.hc",
      ]),
    ).toEqual(["a.hc", "b.hc", "figures.hc"]);
  });

  it("refuses a name that would not be a canonical key", () => {
    expect(() => hcFiles(["figures.hc", "bad name.hc"])).toThrow(
      "bad name.hc",
    );
    expect(() => hcFiles(["x.y.hc"])).toThrow("x.y.hc");
  });
});

describe("hcKey", () => {
  it("is the root-relative path a bundled file is served under", () => {
    expect(hcKey("figures.hc")).toEqual("hc/figures.hc");
  });
});

describe("renderEmbed", () => {
  it("carries every source byte for byte, in the order given", async () => {
    const sources = [
      { file: "b.hc", source: 'a "quote" and \\ backslash\n' },
      { file: "a.hc", source: "" },
      { file: "c.hc", source: "no newline" },
      { file: "d.hc", source: "crlf\r\nline" },
      { file: "e.hc", source: "“curly” text\n" },
    ];
    const embed = await importEmbed(renderEmbed(sources));

    expect([...embed.keys()]).toEqual(
      sources.map(({ file }) => `hc/${file}`),
    );
    for (const { file, source } of sources) {
      expect(embed.get(`hc/${file}`)).toEqual(source);
    }
  });
});

describe("checkEmbed", () => {
  const sources = [{ file: "a.hc", source: "1 + 1\n" }];

  it("accepts matching sources without modifying the map", () => {
    const embedded = new Map([["hc/a.hc", "1 + 1\n"]]);
    checkEmbed(sources, embedded);
    expect([...embedded]).toEqual([["hc/a.hc", "1 + 1\n"]]);
  });

  it("refuses missing, changed, and obsolete sources without repairing them", () => {
    for (
      const embedded of [
        new Map<string, string>(),
        new Map([["hc/a.hc", "old"]]),
        new Map([["hc/a.hc", "1 + 1\n"], ["hc/old.hc", "obsolete"]]),
      ]
    ) {
      const before = [...embedded];
      expect(() => checkEmbed(sources, embedded)).toThrow(
        "deno task bundle:embed",
      );
      expect([...embedded]).toEqual(before);
    }
  });
});
