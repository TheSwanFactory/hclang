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
  return wrapper.in();
};

let html_call = (content: FrameString) => {
  const html = new FrameExpr([
    new FrameString(HTML_PREFIX),
    html_wrap("head", html_wrap("title", html_content.get("title"))),
    content,
  ]);
  return html.in();
};

describe("FrameHTML", () => {
  const frame_html = new FrameExpr([
    new FrameString(BEGIN_HTML),
    new FrameSymbol("_"),
    new FrameString(END_HTML),
  ]);

  it("embeds properties into head",  () => {
    const html_head = new FrameExpr([
      new FrameString("  <head>\n"),
      new FrameString("    <title>\n"),
      new FrameSymbol("_"),
      new FrameString("    </title>\n"),
      new FrameString("  </head>\n"),
    ]);
    const result = html_head.call(html_content.get("title"));
    const result_string = result.toString();

    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
    expect(result_string).to.match(/<title>([\s\S]*)<\/title>/);
    expect(result_string).to.include(js_title);
  });

  it("HTML-ifies string expressions when called", () => {
    const result = frame_html.call(html_content);
    const result_string = result.toString();

    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
    expect(result_string).to.include(js_string);
  });
});
