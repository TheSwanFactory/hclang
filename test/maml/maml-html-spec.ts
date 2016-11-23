
import { Frame } from "../../src/frames/frame";
import { FrameString } from "../../src/frames/frame-string";
import { FrameExpr } from "../../src/frames/frame-expr";
import * as chai from "chai";

const expect = chai.expect;

export class FrameHTML extends Frame {
  public static readonly BEGIN = `
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
  `;
  public static readonly END = `
  </body>
</html>
  `;

  public call(argument: FrameString) {
    return new FrameString(FrameHTML.BEGIN + argument.toStringData() + FrameHTML.END);
  }
};

describe("FrameHTML", () => {
  const js_string = "Hello, HTML!";
  const frame_string = new FrameString(js_string);
  const frame_html = new FrameHTML();

  it("HTML-ifies string expressions when called", () => {
    const result = frame_html.call(frame_string);
    const result_string = result.toString();
    expect(result).to.be.an.instanceof(FrameString);
    expect(result_string).to.include(js_string);
    expect(result_string).to.include('<!DOCTYPE html>');
    expect(result_string).to.match(/<body>([\s\S]*)<\/body>/);
  });
});
