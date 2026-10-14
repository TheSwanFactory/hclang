import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { errorLines, parseField, parseRecords, splitList } from "./parse.ts";

describe("parseRecords", () => {
  it("reads strings, integers, negative integers and raw tokens", () => {
    const text = [
      "some prose",
      "[“record”, “witness”, “DS”, “0001+1010”, -1, 0, %PT1.5S%]",
      "[“record”, “floor”, “DS”, 0, 1, “0”, 0, 0, “none”, 0]",
    ].join("\n");
    const recs = parseRecords(text);
    expect(recs.length).toBe(2);
    expect(recs[0]).toEqual({
      tag: "witness",
      fields: ["DS", "0001+1010", -1, 0, "%PT1.5S%"],
    });
    expect(recs[1].fields[3]).toBe("0");
  });

  it("finds records nested in a list answered by one statement", () => {
    const text =
      "[[“record”, “edge”, “DS”, “a”, “b”], [“record”, “edge”, “DS”, “c”, “d”]]";
    expect(parseRecords(text).map((r) => r.fields[1])).toEqual(["a", "c"]);
  });

  it("keeps an empty string field", () => {
    expect(parseRecords("[“record”, “t”, “”, 3]")[0].fields).toEqual(["", 3]);
  });
});

describe("helpers", () => {
  it("parses a single field", () => {
    expect(parseField(" 12 ")).toBe(12);
    expect(parseField("“x”")).toBe("x");
  });
  it("splits joined lists", () => {
    expect(splitList("011/1/")).toEqual(["011", "1"]);
    expect(splitList("")).toEqual([]);
  });
  it("flags runtime error values", () => {
    expect(errorLines("ok\n[1, $!.name-missing “x”;]\nParsePipe.canPop.failed"))
      .toHaveLength(2);
  });
});
