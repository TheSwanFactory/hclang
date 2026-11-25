/**
 * FOIST 19a: Count and Size retain their native Figure meanings while
 * Denumeration, KD coordinates and structural product have new public roles.
 */
import { expect } from "@std/expect";
import { HCLang } from "../mod.ts";

const shapes = [
  ["[]", "0", "1"],
  ["[[]]", "1", "1"],
  ["[[], []]", "2", "2"],
  ["[[], [[], []]]", "2", "3"],
  ["[[[], []], [[], [], []]]", "2", "5"],
] as const;

Deno.test("FOIST 19a preserves native immediate Count and structural Size", async () => {
  const hc = new HCLang();
  for (const [source, expectedCount, expectedSize] of shapes) {
    expect(await hc.call(source + ".#"), source).toEqual(expectedCount);
    expect(await hc.call(source + ".##"), source).toEqual(expectedSize);
  }
});

Deno.test("FOIST 19a Figures remains a pure projection module", async () => {
  const hc = new HCLang();
  expect(await hc.call("Figures <- './hc/figures.hc'"))
    .not.toContain("$!");
  expect(await hc.call("Figures.Figure")).toContain("name-missing");
  expect(await hc.call("Figures.inlay")).toContain("name-missing");
});

Deno.test("FOIST 19a raw Denum counts each immediate Figure child", async () => {
  const hc = new HCLang();
  expect(await hc.call("“” [[], [[], []]].###"))
    .toEqual("“Denum(2,[1, 2])”");
  expect(await hc.call("[[], [[], []]].####"))
    .toEqual("[-1]");
  expect(await hc.call("[] .####")).toEqual("[]");
});

Deno.test("FOIST 19a Cart pairs whole nested figures rather than replacing leaves", async () => {
  const hc = new HCLang();
  expect(await hc.call("[[], [[], []]] * [1, 2]"))
    .toEqual("[[[], 1], [[], 2], [[[], []], 1], [[[], []], 2]]");
});

Deno.test("FOIST 19a preserves incidence and identity of shared children", async () => {
  const hc = new HCLang();
  await hc.call(".shared [[]]; .xs [shared, []];");
  expect(await hc.call("shared ~~~ xs")).toEqual("<>");
  expect(await hc.call("(xs .0) === shared")).toEqual("<>");
});

Deno.test("FOIST 19a unsigned Count remains numeric under scalar arithmetic", async () => {
  const hc = new HCLang();
  expect(await hc.call("2 + 3")).toEqual("5");
  expect(await hc.call("2 * 3")).toEqual("6");
  expect(await hc.call("7 %% 2")).toEqual("1");
});

Deno.test("FOIST 19a removes all old geometric suffix observer spellings", async () => {
  const hc = new HCLang();
  for (const key of ["#%", "##%", "###%", "##%%", "###%%", "##%%%", "###%%%"]) {
    expect(await hc.call("[3, 1]." + key)).toContain("name-missing");
  }
});
