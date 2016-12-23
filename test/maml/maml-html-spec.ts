import { expect } from "chai";
import { Frame, FrameExpr, FrameString, FrameSymbol } from "../../src/frames";

const html_wrap = (tag: string, content: Frame) => {
  return new FrameExpr([
    new FrameString(`<${tag}>`), content, new FrameString(`</${tag}>`)
  ]);
};

const HTML_PREFIX = "<!DOCTYPE html>"
const html_call = (content: FrameString) => {
  const html_head = html_wrap("title", content.get("title"));
  const html = new FrameExpr([
    new FrameString(HTML_PREFIX),
    html_wrap("head", html_head),
    html_wrap("body", content),
  ]);
  return html.in([Frame.nil]);
};

describe("FrameHTML", () => {
  const js_string = "Hello, HTML!";
  const js_title = "First HTML6 File";
  const html_content = new FrameString(js_string, {
      title:new FrameString(js_title)
    }
  );

  const result = html_call(html_content);
  const result_string = result.toString();

  it("returns a FrameString",  () => {
    expect(result).to.be.an.instanceof(FrameString);
  });

  it("embeds properties into head",  () => {
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
    expect(result_string).to.match(/<title>([\s\S]*)<\/title>/);
    expect(result_string).to.include(js_title);
  });

  it("HTML-ifies string expressions when called", () => {
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
    expect(result_string).to.include(js_string);
  });
});
