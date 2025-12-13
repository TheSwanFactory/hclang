import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameExpr, FrameString } from "../lib/frames.ts";
import { maml } from "../lib/maml.ts";

describe("maml", () => {
  const body_text = "Hello, MAML!";
  const title_text = "First MAML Document ever";
  const body = new FrameString(body_text, {
    author: new FrameString("Ernest Prabhakar"),
    title: new FrameString(title_text),
  });
  const result = maml.call(body);
  const result_string = result.toString();

  it("is a FrameExpr", () => {
    expect(maml).toBeInstanceOf(FrameExpr);
  });

  it("when called, returns a FrameString", () => {
    expect(result).toBeInstanceOf(FrameString);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");

    expect(tag).toBeInstanceOf(FrameExpr);
    expect(result_string).not.toContain(".missing");
  });

  it("wraps everything in an HTML tag", () => {
    expect(result_string).toMatch(/<html>([\s\S]*)<\/html>/);
  });

  it("wraps arg contents in a body tag", () => {
    expect(result_string).toContain(`<body>${body_text}</body>`);
  });

  it("wraps arg metas in a head tag", () => {
    expect(result_string).toMatch(/<head>([\s\S]*)<\/head>/);
  });

  it("wraps title meta in title tag", () => {
    expect(result_string).toContain(`<title>${title_text}</title>`);
  });

  it("wraps all metas in their keyed tag", () => {
    expect(result_string).toMatch(/<author>([\s\S]*)<\/author>/);
    expect(result_string).toMatch(/<title>([\s\S]*)<\/title>/);
  });
});
