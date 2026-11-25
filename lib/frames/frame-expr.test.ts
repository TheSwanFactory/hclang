import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import {
  Frame,
  FrameArg,
  FrameArray,
  FrameCount,
  FrameExpr,
  FrameLazy,
  FrameName,
  FrameScoped,
  FrameString,
  FrameSymbol,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";
import {
  lastResultText as text,
  lastTermOfLast as last,
} from "../test-helpers.test.ts";

describe("FrameExpr", () => {
  const frame = new Frame();
  const js_string = "Hello";
  const frame_string = new FrameString(js_string);
  const context = new FrameString("context", { key: frame_string });

  it("stringifies with parentheses", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    const actual = frame_expr.toString();
    // Just check key parts due to smart quote encoding complexity
    expect(actual).toContain("()");
    expect(actual).toContain("Hello");
    expect(actual).toContain(".context");
    expect(actual).toContain(".key");
  });

  it("replaces nil when evaluated", () => {
    const frame_expr = new FrameExpr([frame, frame_string], { context });
    const result = frame_expr.in([frame]);
    expect(result).toEqual(frame_string);
  });

  it("concatenates string expressions when called", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_expr = new FrameExpr([frame_string, frame_string_2]);
    const result = frame_expr.in([frame]);

    expect(result.toString()).toEqual(`“${js_string}${js_string_2}”`);
  });

  it("returns context for FrameArg.here", () => {
    const frame_expr = new FrameExpr([FrameArg.here()]);
    const result = frame_expr.in([context]);

    expect(result).toEqual(context);
  });

  it("applies FrameName to FrameArray through a read projection", () => {
    const js_string_2 = ", MAML!";
    const frame_string_2 = new FrameString(js_string_2);
    const frame_array = new FrameArray([frame_string, frame_string_2]);
    const frame_name = new FrameName("1");
    const frame_expr = new FrameExpr([frame_array, frame_name]);
    const result = frame_expr.in([frame]);

    expect(result).not.toBe(frame_string_2);
    expect(result.toString()).toEqual(frame_string_2.toString());
    expect(frame_string_2.up).toBe(Frame.missing);
  });

  it("evaluates in context through a read projection", () => {
    const frame_expr = new FrameExpr([
      FrameArg.here(),
      new FrameName("key"),
    ]);
    const result = frame_expr.call(context);

    expect(result).not.toBe(frame_string);
    expect(result.toString()).toEqual(frame_string.toString());
    expect(result.up).toBe(context);
    expect(frame_string.up).toBe(Frame.missing);
  });

  describe("with Properties, when called", () => {
    const slow = new FrameString("slow");
    const space = new FrameString(" ");
    const turtle = new FrameString("turtle");

    const s_speed = new FrameSymbol("speed");
    const s_gap = new FrameSymbol("gap");
    const expr_array = [s_speed, s_gap, FrameArg.here()];

    it("evaluates properties in its local context", () => {
      const frame_expr = new FrameExpr([s_speed], { speed: slow, gap: space });

      expect(frame_expr.call(Frame.nil).toString()).toEqual("“slow”");
    });

    it("evaluates a sequence of properties", () => {
      const frame_expr = new FrameExpr(expr_array, { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).toEqual("“slow turtle”");
    });

    it("evaluates recursively", () => {
      const sub_expr = new FrameExpr(expr_array);
      const frame_expr = new FrameExpr([sub_expr], { speed: slow, gap: space });

      expect(frame_expr.call(turtle).toString()).toEqual("“slow turtle”");
    });
  });

  it("evaluates when a size operator is applied, rather than counting (#411)", () => {
    // Calling an expression evaluates it, so the operator is only the
    // argument: “a” “b” joins whatever it is called with.
    const frame_expr = new FrameExpr([frame_string, new FrameString("!")]);

    expect(frame_expr.call(FrameSymbol.address("#")).toString())
      .toEqual("“Hello!”");
    // An expression codified from source is called the same way.
    expect(evaluate("({} [5, 7]).#").at(0).toString()).toEqual("35");
  });

  describe("integer repetition (v0.22.0)", () => {
    it("has no repetition rule of its own", () => {
      // An expression or closure is applied repeatedly, as before, rather
      // than concatenating its terms, which are code.
      expect(new FrameExpr([new FrameString("a")]).repetitionFor(3n))
        .toBeUndefined();
      expect(new FrameLazy([new FrameString("a")]).repetitionFor(3n))
        .toBeUndefined();
      // Text and a number have none either, by the base default: only an
      // aggregate has a rule.
      expect(new FrameString("ab").repetitionFor(3n)).toBeUndefined();
      expect(new FrameCount(2n).repetitionFor(3n)).toBeUndefined();
    });
  });
});

describe("walking an expression (#429, spec a16, a17)", () => {
  it("walks a codified expression as its atoms, statements kept", () => {
    // A value's statement answers nothing, so `[1; 2]` iterated is `[2]`. An
    // expression codified from it is code, and walks as a body does, with the
    // statement's `;` kept as a word.
    expect(text("({} [1; 2]) & {_}")).toEqual("[1, ;, 2]");
  });
  it("walks a source aggregate as a body, statements and separators kept", () => {
    // Indexing a walked aggregate reaches the source aggregate nested in it,
    // which no evaluation has made a value.
    expect(text("((({[[a; b]]} & {_}) .0) .0) & {_}")).toEqual("[a, ;, b]");
    expect(text("((({[[a b, c]]} & {_}) .0) .0) & {“” _}"))
      .toEqual("[“a”, “b”, “,”, “c”]");
  });
  describe("a term held with its closure's scope", () => {
    it("compares as its term does, by value", () => {
      // `3 = 3.0`: the held source aggregate compares by its members' values,
      // not by its text.
      expect(last(".f {g [3]}; ((f & {_}) .1) = [3.0]").toString())
        .toEqual("<>");
      expect(last(".f {g [3]}; ((f & {_}) .1) = [4]").toString())
        .toEqual("()");
    });
    it("is a plain expression when its term is one", () => {
      const tight = last(".o [.x 5]; .f {g o.x}; (f & {_}) .1");
      expect(tight).toBeInstanceOf(FrameScoped);
      expect(tight.isPlainExpression()).toBe(true);
      const aggregate = last(".f {g [3]}; (f & {_}) .1");
      expect(aggregate).toBeInstanceOf(FrameScoped);
      expect(aggregate.isPlainExpression()).toBe(false);
    });
    it("has its term's data plane", () => {
      // Two walks that hold different aggregates have different data planes.
      const walk = last(".f {g [3]}; f & {_}");
      expect(walk.dataEquals(last(".f {g [3]}; f & {_}"))).toBe(Frame.all);
      expect(walk.dataEquals(last(".f {g [4]}; f & {_}"))).toBe(Frame.nil);
    });
  });
});
describe("FrameExpr refusals (#524)", () => {
  it("refuses a tight catcher that opens an expression, with nothing to guard", () => {
    // After a leading space the tight `$!{0}` is the expression's first term.
    expect(evaluate("( $!{0} 1)").at(0).toString())
      .toEqual("$!.catch-operand-missing");
    expect(evaluate("((1 / 0) $!{0})").at(0).toString()).toEqual("0");
  });
  it("refuses a tight catcher with no handler", () => {
    // The parser unwraps a one-term tight expression, so only a host builds a
    // catcher of the catch operator alone. The operator comes from a parse.
    const find = (term: Frame, depth = 0): Frame | undefined =>
      term.isClass("FrameCatch")
        ? term
        : depth > 3
        ? undefined
        : term.asArray().map((child) => find(child, depth + 1))
          .find((found) => found !== undefined);
    const operator = find(evaluate("{1 $! 2}").at(0))!;
    expect(operator.isClass("FrameCatch")).toBe(true);
    const failing = new FrameExpr([
      FrameSymbol.for("nope"),
      new FrameExpr([operator]),
    ]);
    expect(failing.in([new FrameArray([])]).toString())
      .toEqual("$!.catch-handler-missing");
  });
  it("refuses a schema definition whose name is not a setter", () => {
    // `.^` outside construction and `.` outside a call answer no setter.
    expect(evaluate(".^ <1>;").toString())
      .toEqual("[($!.unsupported-schema-definition);]");
    expect(evaluate(". <1>;").toString())
      .toEqual("[($!.unsupported-schema-definition);]");
    expect(evaluate(".x <1>;").toString()).toEqual("[.x <1>; .x.<> <1>;]");
  });
  it("refuses the size of an expression wrapped in itself", () => {
    // Built directly, since the cycle is the subject and not how one arises.
    const terms: Frame[] = [];
    const wrapper = new FrameExpr(terms);
    terms.push(wrapper);
    const expr = new FrameExpr([wrapper, new FrameCount(1n)]);
    expect(expr.sizeFor("#").toString()).toEqual("$!.cyclic-aggregate .##");
    expect(expr.sizeFor("##").toString()).toEqual("$!.cyclic-aggregate .##");
  });
});
