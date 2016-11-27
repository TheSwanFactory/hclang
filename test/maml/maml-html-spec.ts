import { Frame } from "../../src/frames/frame";
import { FrameString } from "../../src/frames/frame-string";
import { FrameExpr } from "../../src/frames/frame-expr";
import { FrameSymbol} from "../../src/frames/frame-symbol";
import * as chai from "chai";

const expect = chai.expect;

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

class HTMLExpr extends FrameExpr {
  constructor() {
    const data = [
      new FrameString(BEGIN_HTML),
      new FrameSymbol("_"),
      new FrameString(END_HTML),
    ]
    super(data);
  }
};



describe("FrameHTML", () => {
  const js_string = "Hello, HTML!";
  const frame_string = new FrameString(js_string);
  const frame_html = new HTMLExpr();

  it("HTML-ifies string expressions when called", () => {
    const result = frame_html.call(frame_string);
    const result_string = result.toString();
    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
    expect(result_string).to.include(js_string);
  });
});
