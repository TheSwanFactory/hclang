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
    expect(result_string).not.toContain("$!");
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

describe("MAML metadata rendering", () => {
  it("joins metadata tags as text and keeps body contents out of head", () => {
    const body = new FrameString("Body text", {
      author: new FrameString("An author"),
      title: new FrameString("A title"),
    });
    expect(maml.call(body).toString()).toEqual(
      "“<!DOCTYPE html><html><head><author>An author</author><title>A title</title></head><body>Body text</body></html>”",
    );
  });

  it("renders an empty head when no metadata is present", () => {
    expect(maml.call(new FrameString("Body")).toString()).toEqual(
      "“<!DOCTYPE html><html><head></head><body>Body</body></html>”",
    );
  });

  it("uses public metadata only and preserves the source", () => {
    const body = new FrameString("Body", {
      _private: new FrameString("secret"),
      "title.<>": new FrameString("schema"),
      "/pattern/": new FrameString("matcher"),
      title: new FrameString("Visible"),
    });
    const before = body.toString();
    expect(maml.call(body).toString()).toEqual(
      "“<!DOCTYPE html><html><head><title>Visible</title></head><body>Body</body></html>”",
    );
    expect(body.toString()).toEqual(before);
  });

  it("does not retain metadata between calls", () => {
    const first = maml.call(
      new FrameString("One", {
        title: new FrameString("First"),
      }),
    );
    const second = maml.call(
      new FrameString("Two", {
        author: new FrameString("Second"),
      }),
    );
    expect(first.toString()).toContain("<title>First</title>");
    expect(second.toString()).toEqual(
      "“<!DOCTYPE html><html><head><author>Second</author></head><body>Two</body></html>”",
    );
  });
});
