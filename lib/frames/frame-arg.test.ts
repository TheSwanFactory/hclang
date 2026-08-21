import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  EvaluationScope,
  Frame,
  FrameArg,
  FrameParam,
  FrameString,
  FrameSymbol,
  ScanDisposition,
} from "../frames.ts";

describe("FrameArg", () => {
  const frame_arg = FrameArg.here();

  describe("here", () => {
    it("is created from 'here'", () => {
      expect(frame_arg).toBeInstanceOf(FrameArg);
    });

    it("stringifies to underscore", () => {
      expect(frame_arg.toString()).toEqual("_");
    });

    it("evaluates to the context", () => {
      const context = new FrameString("context", { atom: frame_arg });
      expect(FrameArg.here().in([context])).toEqual(context);
    });
  });

  describe("level", () => {
    it("returns 'here' at level 1", () => {
      const frame_level = FrameArg.level();
      expect(frame_level).toEqual(frame_arg);
    });

    it("returns the same object at each level", () => {
      const level_2 = FrameArg.level(2);
      expect(FrameArg.level(2)).toEqual(level_2);
    });

    it("evaluates to a lower level", () => {
      const context = new FrameString("context", { atom: frame_arg });
      const level_3 = FrameArg.level(3);
      const level_2 = FrameArg.level(2);
      expect(level_3.in([context])).toEqual(level_2);
      expect(level_2.in([context])).toEqual(frame_arg);
    });
  });

  describe("FrameParam", () => {
    const frame_param = FrameParam.there();
    const context = new FrameString("context");
    const param = new FrameString("param");

    it("is constructed only when its class-side recognition completes", () => {
      const firstCaret = FrameArg.SYNTAX.recognize(
        FrameSymbol.for("^"),
        "",
        Frame.nil,
      );
      expect(firstCaret).toEqual({ disposition: ScanDisposition.Consume });

      const completed = FrameArg.SYNTAX.recognize(
        FrameSymbol.for(" "),
        "^^",
        Frame.nil,
      );
      expect(completed.disposition).toEqual(
        ScanDisposition.CompleteRedispatch,
      );
      expect(completed.frame).toBeInstanceOf(FrameParam);
      expect(completed.frame?.toString()).toEqual("_^^");
    });

    it("constructs a parameter value on physical EOF", () => {
      const completed = FrameArg.SYNTAX.finish("^");

      expect(completed.disposition).toEqual(ScanDisposition.CompleteConsume);
      expect(completed.frame).toBeInstanceOf(FrameParam);
      expect(completed.frame?.toString()).toEqual("_^");
    });

    it("is created from 'there'", () => {
      expect(frame_param).toBeInstanceOf(FrameParam);
    });

    it("stringifies to _^", () => {
      expect(frame_param.toString()).toEqual("_^");
    });

    it("evaluates to the parameter", () => {
      expect(frame_param.in([context, param])).toEqual(param);
    });

    it("reports a missing scope for a level the flat adapter cannot express", () => {
      // Beyond one caret, a level names an enclosing lexical scope rather than
      // an array index, so a flat context list has nothing to resolve against.
      const frame_param_2 = FrameParam.level(2);
      const param2 = new FrameString("param level 2");

      expect(frame_param_2.toString()).toEqual("_^^");
      expect(frame_param_2.in([context, param, param2]).toString())
        .toContain("$!.name-missing");
    });

    it("evaluates each level against one enclosing lexical scope", () => {
      const outer = EvaluationScope.call(new FrameString("outer"));
      const middle = EvaluationScope.call(
        new FrameString("middle"),
        Frame.nil,
        undefined,
        outer,
      );
      const inner = EvaluationScope.call(
        new FrameString("inner"),
        Frame.nil,
        undefined,
        middle,
      );

      expect(FrameParam.level(1).in(inner)).toBe(middle.lexicalTarget);
      expect(FrameParam.level(2).in(inner)).toBe(outer.lexicalTarget);
      expect(FrameParam.level(3).in(inner).toString())
        .toContain("$!.name-missing");
    });
  });
});
