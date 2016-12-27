import { expect } from "chai";
import { Frame, FrameArray, FrameExpr, FrameString, IKeyValuePair } from "../../src/frames";
import { maml } from "../../src/maml";

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
  });

  it("wraps everything in an HTML tag", () => {
    expect(result_string).to.match(/<html>([\s\S]*)<\/html>/);
  });

  it("wraps arg contents in a body tag", () => {
    expect(result_string).to.include(`<body>${body_text}<\/body>`);
  });

  it("wraps arg metas in a head tag", () => {
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
  });

  it("wraps title meta in title tag", () => {
    expect(result_string).to.include(`<title>${title_text}<\/title>`);
  });

  it("wraps all metas in their keyed tag", () => {
    const tag = maml.get("tag");
    const block = (item: IKeyValuePair, index: number, array: IKeyValuePair[]) => {
      const key = item[0];
      const value = item[1];
      const tag_name = new FrameString(key);
      return tag.call(tag_name).call(value);
    };
    const tag_list = body.meta_pairs().map(block);
    const tags = new FrameArray(tag_list);
    const tag_string = tags.toString();

    expect(tag_string).to.match(/<author>([\s\S]*)<\/author>/);
    expect(tag_string).to.match(/<title>([\s\S]*)<\/title>/);
  });
});
