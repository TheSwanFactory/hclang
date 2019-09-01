
import { expect } from "chai";
import {} from "mocha";
import { FrameExpr, FrameString, FrameSymbol } from "../../src/frames";
import { maml } from "../../src/maml";

describe("MAML Tag", () => {
  const tag = maml.get("tag");
  const p = new FrameString("p");
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const stringify_tag = "({} [(“<” _ “>”), __, (“</” _ “>”)])";
  const p_tag = tag.call(p);

  it("is a FrameExpr", () => {
    expect(tag).to.be.instanceOf(FrameExpr);
  });

  it("stringifies to an expression", () => {
    expect(tag.toString()).to.equal(stringify_tag);
  });

  it("converts a string into an expr", () => {
    expect(p_tag).to.be.instanceOf(FrameExpr);
    expect(p_tag.toString()).to.equal("(“<p>” _ “</p>”)");
  });

  it("then wraps tags around a string", () => {
    const result = p_tag.call(body);
    expect(result).to.be.instanceOf(FrameString);

    const result_string = result.toString();
    expect(result_string).to.include(text);
    expect(result_string).to.equal(`“<p>${text}<\/p>”`);
  });

  it("can be bound to a name", () => {
    const expr = new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString("body"),
    ]);
    const scope = new FrameString("scope", {tag});
    const evaluated = expr.in([scope]);
    expect(evaluated.toString()).to.equal("(“<body>” _ “</body>”)");
  });

  it("works in expressions", () => {
    const contents = "contents";
    const expr = new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString("body"),
      new FrameString(contents),
    ]);
    const scope = new FrameString("scope", {tag});
    const evaluated = expr.in([scope]);
    const evaluated_string = evaluated.toString();

    expect(evaluated).to.be.instanceOf(FrameString);
    expect(evaluated_string).to.include(contents);
    expect(evaluated_string).to.match(/<body>([\s\S]*)<\/body>/);
  });
});
