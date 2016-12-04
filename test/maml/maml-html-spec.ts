import { expect } from "chai";
import { Frame, FrameExpr, FrameString, FrameSymbol } from "../../src/frames";

const BEGIN_HTML = `
<!DOCTYPE html>
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

describe("FrameHTML", () => {
  const frame_string = new FrameString(js_string);
  const frame_html = new FrameExpr([
    new FrameString(BEGIN_HTML),
    new FrameSymbol("_"),
    new FrameString(END_HTML),
  ]);

  it("embeds properties into head",  () => {
    const frame_title = new FrameString(js_title);
    const frame_head = new Frame({title: frame_title});
    const html_head = new FrameExpr([
      new FrameString("  <head>\n"),
      new FrameString("    <title>\n"),
      new FrameSymbol("_"),
      new FrameString("    </title>\n"),
      new FrameString("  </head>\n"),
    ]);
    const result = html_head.call(frame_head.get("title"));
    const result_string = result.toString();

    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.match(/<head>([\s\S]*)<\/head>/);
    expect(result_string).to.match(/<title>([\s\S]*)<\/title>/);
    expect(result_string).to.include(js_title);
  });

  it("HTML-ifies string expressions when called", () => {
    const result = frame_html.call(frame_string);
    const result_string = result.toString();

    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
    expect(result_string).to.include(js_string);
  });
});
