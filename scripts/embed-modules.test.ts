import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  moduleFiles,
  moduleKey,
  renderDriftTest,
  renderEmbed,
} from "./embed-modules.ts";

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
  return rendered.STANDARD_SOURCES;
};

describe("moduleFiles", () => {
  it("keeps only the module files, sorted", () => {
    expect(
      moduleFiles([
        "b.hc",
        "standard-modules.ts",
        "figures.hc",
        "standard-sources.test.ts",
        "a.hc",
      ]),
    ).toEqual(["a.hc", "b.hc", "figures.hc"]);
  });

  it("refuses a name that would not be a canonical key", () => {
    expect(() => moduleFiles(["figures.hc", "bad name.hc"])).toThrow(
      "bad name.hc",
    );
    expect(() => moduleFiles(["x.y.hc"])).toThrow("x.y.hc");
  });
});

describe("moduleKey", () => {
  it("is the root-relative path the module is served under", () => {
    expect(moduleKey("figures.hc")).toEqual("modules/figures.hc");
  });
});

describe("renderEmbed", () => {
  it("carries every source byte for byte, in the order given", async () => {
    const modules = [
      { file: "b.hc", source: 'a "quote" and \\ backslash\n' },
      { file: "a.hc", source: "" },
      { file: "c.hc", source: "no newline" },
      { file: "d.hc", source: "crlf\r\nline" },
      { file: "e.hc", source: "“curly” text\n" },
    ];
    const embed = await importEmbed(renderEmbed(modules));

    expect([...embed.keys()]).toEqual(
      modules.map(({ file }) => `modules/${file}`),
    );
    for (const { file, source } of modules) {
      expect(embed.get(`modules/${file}`)).toEqual(source);
    }
  });
});

describe("renderDriftTest", () => {
  it("imports every module and compares each with the embed", () => {
    const text = renderDriftTest([
      { file: "a.hc", source: "" },
      { file: "figures.hc", source: "" },
    ]);

    expect(text).toContain(
      'import source0 from "./a.hc" with { type: "text" };',
    );
    expect(text).toContain(
      'import source1 from "./figures.hc" with { type: "text" };',
    );
    expect(text).toContain(
      'import { STANDARD_SOURCES } from "./standard-sources.ts";',
    );
    expect(text).toContain('["modules/a.hc", source0],');
    expect(text).toContain('["modules/figures.hc", source1],');
  });
});
