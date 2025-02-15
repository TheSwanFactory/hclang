import { expect } from "jsr:@std/expect";
import { describe, it } from "jsr:@std/testing/bdd";

import { FrameExpr, FrameString } from "../../src/frames.ts";
import { maml } from "../../src/maml.ts";

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
    expect(maml).to.be.instanceOf(FrameExpr);
  });

  it("when called, returns a FrameString", () => {
    expect(result).to.be.instanceOf(FrameString);
  });

  it("has a tag property", () => {
    const tag = maml.get("tag");

    expect(tag).to.be.instanceOf(FrameExpr);
    expect(result_string).to.not.include(".missing");
  });

  it("wraps everything in an HTML tag", () => {
    expect(result_string).to.match(/<html>([\s\S]*)<\/html>/);
  });

  it("wraps arg contents in a body tag", () => {
    expect(result_string).to.include(`<body>${body_text}</body>`);
  });

  it("wraps arg metas in a head tag", () => {
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
  });

  it("wraps title meta in title tag", () => {
    expect(result_string).to.include(`<title>${title_text}</title>`);
  });

  it("wraps all metas in their keyed tag", () => {
    expect(result_string).to.match(/<author>([\s\S]*)<\/author>/);
    expect(result_string).to.match(/<title>([\s\S]*)<\/title>/);
  });
});
