import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameString, FrameURI } from "../frames.ts";
import { ScanDisposition } from "../scan.ts";
import { FrameSymbol } from "./frame-symbol.ts";

const scan = (uri: FrameURI, char: string, source: string) =>
  uri.scan(FrameSymbol.for(char), source);

describe("FrameURI", () => {
  const reference = "https://example.com/hc/doc?v=1#top";
  const uri = new FrameURI(reference);

  it("is exported", () => {
    expect(FrameURI).toBeTruthy();
  });

  it("stringifies inside single quotes", () => {
    expect(uri.toString()).toEqual(`'${reference}'`);
    expect(uri.string_prefix()).toEqual("'");
    expect(uri.string_suffix()).toEqual("'");
  });

  it("decomposes a reference into readable components", () => {
    expect(uri.get("scheme").toString()).toEqual("“https”");
    expect(uri.get("authority").toString()).toEqual("“example.com”");
    expect(uri.get("path").toString()).toEqual("“/hc/doc”");
    expect(uri.get("query").toString()).toEqual("“v=1”");
    expect(uri.get("fragment").toString()).toEqual("“top”");
  });

  it("decomposes an opaque module specifier", () => {
    const specifier = new FrameURI("jsr:@swanfactory/hclang");

    expect(specifier.get("scheme").toString()).toEqual("“jsr”");
    expect(specifier.get("path").toString()).toEqual("“@swanfactory/hclang”");
    expect(specifier.get("authority").is.missing).toEqual(true);
  });

  it("omits absent components", () => {
    const relative = new FrameURI("hc/doc");

    expect(relative.get("scheme").is.missing).toEqual(true);
    expect(relative.get("query").is.missing).toEqual(true);
    expect(relative.get("path").toString()).toEqual("“hc/doc”");
  });

  it("round-trips and compares by reference", () => {
    expect(uri.isEqualTo(new FrameURI(reference))).toEqual(true);
    expect(uri.isEqualTo(new FrameURI("hc/doc"))).toEqual(false);
    expect(uri.isEqualTo(new FrameString(reference))).toEqual(false);
  });

  it("evaluates to itself instead of a lookup", () => {
    expect(uri.in([new FrameString("context")])).toBe(uri);
  });

  it("completes on the closing quote", () => {
    expect(scan(uri, "'", "hc/doc")).toEqual({
      disposition: ScanDisposition.CompleteConsume,
    });
  });

  it("rejects an empty identifier", () => {
    expect(scan(uri, "'", "")).toEqual({
      disposition: ScanDisposition.Error,
      message: "empty resource identifier: ''",
    });
  });

  it("does not nest", () => {
    expect(uri.nestingDepth("'inner'")).toEqual(0);
  });

  it("rejects characters excluded from a URI reference", () => {
    for (const char of ["<", ">", "{", "}", "|", "\\", "^", '"', "`"]) {
      expect(scan(uri, char, "hc")).toEqual({
        disposition: ScanDisposition.Error,
        message: `invalid resource identifier: 'hc${char}`,
      });
    }
  });

  it("reports whitespace as an unterminated identifier", () => {
    expect(scan(uri, " ", "don")).toEqual({
      disposition: ScanDisposition.Error,
      message: "unterminated resource identifier: 'don",
    });
  });

  it("reports an unterminated identifier at end of input", () => {
    expect(uri.finishInput("hc/doc")).toEqual({
      disposition: ScanDisposition.Error,
      message: "unterminated FrameURI: 'hc/doc",
    });
  });
});
