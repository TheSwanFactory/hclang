import { describe, it } from "jsr:@std/testing@1.0.15/bdd";
import { expect } from "jsr:@std/expect@1.0.17";
import { dirname, fromFileUrl, join } from "jsr:@std/path@1.1.6";

const rootDir = dirname(dirname(dirname(fromFileUrl(import.meta.url))));
const distDir = join(rootDir, "dist");
const artifactPath = join(distDir, "hcweb.html");
const html = await Deno.readTextFile(artifactPath);

/** Returns the contents of every executable inline script. */
function inlineScripts(source: string): string[] {
  return [
    ...source.matchAll(
      /<script(?![^>]*\btype\s*=)[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
    .map((match) => match[1]);
}

function metaContent(name: string): string | undefined {
  const pattern = new RegExp(
    `<meta name="${name}" content="([^"]*)"`,
    "i",
  );
  return html.match(pattern)?.[1];
}

describe("standalone artifact", () => {
  it("ships only the HTML file, its mirror copy, and the checksum", async () => {
    const entries: string[] = [];
    for await (const entry of Deno.readDir(distDir)) entries.push(entry.name);
    expect(entries.sort()).toEqual([
      "hcweb.html",
      "hcweb.html.sha256",
      "index.html",
    ]);
  });

  it("mirrors the artifact byte-for-byte as index.html", async () => {
    const mirror = await Deno.readFile(join(distDir, "index.html"));
    const artifact = await Deno.readFile(artifactPath);
    expect(mirror).toEqual(artifact);
  });

  it("matches its published checksum", async () => {
    const sidecar = await Deno.readTextFile(`${artifactPath}.sha256`);
    const bytes = await Deno.readFile(artifactPath);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const checksum = Array.from(digest, (b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(sidecar.trim()).toBe(`${checksum}  hcweb.html`);
  });

  it("contains exactly one executable inline script", () => {
    const scripts = inlineScripts(html);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].length).toBeGreaterThan(1000);
  });

  it("loads no external script, style, or module", () => {
    expect(/<script[^>]*\bsrc=/i.test(html)).toBe(false);
    expect(/<link[^>]*rel=["']?stylesheet/i.test(html)).toBe(false);
    const script = inlineScripts(html)[0];
    expect(/\bimport\s*\(/.test(script)).toBe(false);
    expect(/\bfrom\s*["']/.test(script)).toBe(false);
    expect(script.includes("jsr:")).toBe(false);
    expect(script.includes("npm:")).toBe(false);
    expect(script.includes("//esm.sh")).toBe(false);
    expect(script.includes("sourceMappingURL")).toBe(false);
  });

  it("retains no server, framework, or local build references", () => {
    for (const token of ["_fresh", "fresh/core", "plugin-vite", "localhost"]) {
      expect(html.includes(token)).toBe(false);
    }
    expect(html.includes(rootDir)).toBe(false);
  });

  it("records reproducible provenance metadata", async () => {
    const manifest = JSON.parse(
      await Deno.readTextFile(join(rootDir, "web/deno.json")),
    );
    expect(metaContent("hcweb-version")).toBe(manifest.version);
    expect(metaContent("hclang-version")).toBe(manifest.version);
    expect(metaContent("source-commit")).toMatch(/^[0-9a-f]{40}$/);
    expect(metaContent("build-date")).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(metaContent("package-source")).toBeTruthy();
  });

  it("mounts the playground into the template root", () => {
    expect(html.includes('<div id="hcweb-root"></div>')).toBe(true);
    expect(html.includes("<!-- HCWEB_BUNDLE -->")).toBe(false);
  });

  it("preserves dollar sequences during injection", () => {
    // `String.replace` expands `$$` into `$`, which previously collapsed the
    // `$$` end-of-list sentinel onto FrameNote's `$` sigil.
    expect(inlineScripts(html)[0].includes('"$$"')).toBe(true);
  });
});
