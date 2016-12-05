import { expect } from "chai";
import { Frame, FrameExpr, FrameString, FrameSymbol } from "../../src/frames";

const HTML_PREFIX = "<!DOCTYPE html>"
const BEGIN_HTML = `
${HTML_PREFIX}
<html>
<head>
</head>
<body>
`;

const END_HTML = `
</body>
</html>
`;

const js_string = "Hello, HTML!";
const js_title = "First HTML6 File";
const html_content = new FrameString(js_string, {
    title:new FrameString(js_title)
  }
);

let html_wrap = (tag: string, content: Frame) => {
  const wrapper = new FrameExpr([
    new FrameString(`<${tag}>`), content, new FrameString(`</${tag}>`)
  ]);
  return wrapper.in(Frame.nil);
};

let html_call = (content: FrameString) => {
  const html = new FrameExpr([
    new FrameString(HTML_PREFIX),
    html_wrap("head", html_wrap("title", html_content.get("title"))),
    html_wrap("body", content),
  ]);
  return html.in(Frame.nil);
};

const result = html_call(html_content);
const result_string = result.toString();

describe("FrameHTML", () => {

  it("embeds properties into head",  () => {
    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
    expect(result_string).to.match(/<title>([\s\S]*)<\/title>/);
    expect(result_string).to.include(js_title);
  });

  it("HTML-ifies string expressions when called", () => {
    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
    expect(result_string).to.include(js_string);
  });
});
