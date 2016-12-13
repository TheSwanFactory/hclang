import { expect } from "chai";
import { FrameExpr, FrameName, FrameString } from "../../src/frames";
import { maml } from "../../src/maml";

describe("MAML Tag", () => {
  const tag = maml.get("tag");
  const p = new FrameString("p");
  const p_tag = tag.call(p);
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const result = p_tag.call(body);
  const result_string = result.toString();

  it("is a FrameExpr", () => {
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("converts a string into an expr", () => {
    expect(p_tag).to.be.instanceOf(FrameExpr);
  });

  it("then wraps tags around a string", () => {
    expect(result).to.be.instanceOf(FrameString);
    expect(result_string).to.include(text);
    expect(result_string).to.match(/<p>([\s\S]*)<\/p>/);
  });

  it("works in expressions", () => {
    const contents = "contents";
    const expr = new FrameExpr([
      new FrameName("tag"),
      new FrameString("body"),
      new FrameString(contents),
    ]);
    const scope = new FrameString("scope", {tag});
    const evaluated = expr.in(scope)
    const evaluated_string = evaluated.toString();

    expect(evaluated).to.be.instanceOf(FrameString);
    expect(evaluated_string).to.include(contents);
    expect(evaluated_string).to.match(/<body>([\s\S]*)<\/body>/);
  });

});
