import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { FrameExpr, FrameString, FrameSymbol } from "../lib/frames.ts";
import { maml } from "../lib/maml.ts";

describe("MAML Tag", () => {
  const tag = maml.get("tag");
  const p = new FrameString("p");
  const text = "Hello, MAML!";
  const body = new FrameString(text);
  const stringify_tag = "({} [(“<” _ “>”), __, (“</” _ “>”)])";
  const p_tag = tag.call(p);

  it("is a FrameExpr", () => {
    expect(tag).toBeInstanceOf(FrameExpr);
  });

  it("stringifies to an expression", () => {
    expect(tag.toString()).toEqual(stringify_tag);
  });

  it("converts a string into an expr", () => {
    expect(p_tag).toBeInstanceOf(FrameExpr);
    expect(p_tag.toString()).toEqual("(“<p>” _ “</p>”)");
  });

  it("then wraps tags around a string", () => {
    const result = p_tag.call(body);
    expect(result).toBeInstanceOf(FrameString);

    const result_string = result.toString();
    expect(result_string).toContain(text);
    expect(result_string).toEqual(`“<p>${text}</p>”`);
  });

  it("can be bound to a name", () => {
    const expr = new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString("body"),
    ]);
    const scope = new FrameString("scope", { tag });
    const evaluated = expr.in([scope]);
    expect(evaluated.toString()).toEqual("(“<body>” _ “</body>”)");
  });

  it("works in expressions", () => {
    const contents = "contents";
    const expr = new FrameExpr([
      new FrameSymbol("tag"),
      new FrameString("body"),
      new FrameString(contents),
    ]);
    const scope = new FrameString("scope", { tag });
    const evaluated = expr.in([scope]);
    const evaluated_string = evaluated.toString();

    expect(evaluated).toBeInstanceOf(FrameString);
    expect(evaluated_string).toContain(contents);
    expect(evaluated_string).toMatch(/<body>([\s\S]*)<\/body>/);
  });
});
