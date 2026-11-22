import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";
import { evaluate } from "./evaluate.ts";
import { make_context } from "./hc-eval.ts";
import * as frame from "../frames.ts";

describe("evaluate: contexts", () => {
  it("exposes supplied context through the explicit host anchor", () => {
    const context = make_context({ x: "2" });
    const result = evaluate("1 + $$.x", context);

    expect(result.at(0).toString()).toEqual("3");
    expect(result.meta.x).toBeUndefined();
    expect(context.x.toString()).toEqual("2");
  });

  it("extends Unicode host integers with decimal properties", () => {
    const context = make_context({ unicode: "١٢٣" });
    const result = evaluate("$$.unicode.5", context);

    expect(result.at(0).toString()).toEqual("123.5");
    expect(context.unicode.toString()).toEqual("١٢٣");
  });

  it("does not leak host bindings into bare-name lookup", () => {
    const result = evaluate("x", make_context({ x: "2" }));

    expect(result.at(0).toString()).toContain("$!.name-missing");
  });

  it("keeps file writes separate from read-only host bindings", () => {
    const context = make_context({ x: "2" });
    const result = evaluate(".x 3; [$.x, $$.x]", context);

    expect(result.meta.x.toString()).toEqual("3");
    expect(context.x.toString()).toEqual("2");
    expect(result.at(0).toString()).toContain("[3, 2]");
  });

  it("anchors bypass local shadowing at any closure depth", () => {
    const context = make_context({ x: "2" });
    const result = evaluate(
      ".x 1; .read {{.x 9; [x, $.x, $$.x]} ()}; read()",
      context,
    );

    expect(result.at(0).toString()).toContain("[9, 1, 2]");
  });

  it("preserves visibility across bare and file-anchor paths", () => {
    const privateBare = evaluate(".__secret 42; {{secret}()}()");
    const privateAnchored = evaluate(".__secret 42; {{$.secret}()}()");
    const protectedBare = evaluate("._guarded 21; {{guarded}()}()");
    const protectedAnchored = evaluate("._guarded 21; {{$.guarded}()}()");

    for (const result of [privateBare, privateAnchored]) {
      expect(result.at(0).toString()).toContain("$!.is-private .secret");
    }
    for (const result of [protectedBare, protectedAnchored]) {
      expect(result.at(0).toString()).toContain(
        "$!.is-protected .guarded",
      );
    }

    expect(evaluate(".__secret 42; $.secret").at(0).toString()).toMatch(
      /; 42\)$/,
    );
  });

  it("does not grant host-owner visibility through the host anchor", () => {
    const context: frame.Context = {
      __secret: new frame.FrameInt("42"),
      _guarded: new frame.FrameInt("21"),
    };

    for (const source of ["$$.secret", "{{$$.secret}()}()"]) {
      expect(evaluate(source, context).at(0).toString()).toContain(
        "$!.is-private .secret",
      );
    }
    for (const source of ["$$.guarded", "{{$$.guarded}()}()"]) {
      expect(evaluate(source, context).at(0).toString()).toContain(
        "$!.is-protected .guarded",
      );
    }
  });

  it("preserves receiver visibility through anchor projections", () => {
    const declaration = ".__secret 42; ._guarded 21; " +
      ".obj [.read-secret {secret}; .read-guarded {guarded}]; ";
    for (const access of ["obj", "$.obj"]) {
      expect(
        evaluate(`${declaration}${access}.read-secret()`).at(0).toString(),
      ).toContain("$!.is-private .secret");
      expect(
        evaluate(`${declaration}${access}.read-guarded()`).at(0).toString(),
      ).toContain("$!.is-protected .guarded");
    }

    const object = new frame.FrameArray([], {
      readSecret: new frame.FrameLazy([
        new frame.FrameExpr([frame.FrameSymbol.for("secret")]),
      ]),
      readGuarded: new frame.FrameLazy([
        new frame.FrameExpr([frame.FrameSymbol.for("guarded")]),
      ]),
    });
    const context: frame.Context = { object };
    // A host-built method was written in no HC scope, so its free names are
    // missing rather than acquired from the scope it was read from (#400).
    expect(
      evaluate(".__secret 42; $$.object.readSecret()", context).at(0)
        .toString(),
    ).toContain("$!.name-missing");
    expect(
      evaluate("._guarded 21; $$.object.readGuarded()", context).at(0)
        .toString(),
    ).toContain("$!.name-missing");
  });

  it("does not let an alias write through the host namespace", () => {
    const context = make_context({ x: "2" });
    const result = evaluate("@x 9", context);

    expect(result.at(0).toString()).toContain("$!.name-missing");
    expect(context.x.toString()).toEqual("2");
    expect(result.meta.x).toBeUndefined();
  });

  it("does not give host closures ambient access to sibling bindings", () => {
    const context: frame.Context = {
      secret: new frame.FrameInt("42"),
      implicit: new frame.FrameLazy([
        new frame.FrameExpr([frame.FrameSymbol.for("secret")]),
      ]),
      explicit: new frame.FrameLazy([
        new frame.FrameExpr([
          frame.FrameScopeAnchor.host(),
          new frame.FrameName("secret"),
        ]),
      ]),
    };

    expect(evaluate("$$.implicit()", context).at(0).toString()).toContain(
      "$!.name-missing",
    );
    expect(evaluate("$$.explicit()", context).at(0).toString()).toEqual(
      "42",
    );
  });

  it("keeps host lookup out of aggregate method continuations", () => {
    const method = new frame.FrameLazy([
      new frame.FrameExpr([frame.FrameSymbol.for("secret")]),
    ]);
    const object = new frame.FrameArray([], { method });
    const context: frame.Context = {
      secret: new frame.FrameInt("42"),
      object,
    };

    expect(evaluate("$$.object.method()", context).at(0).toString())
      .toContain("$!.name-missing");
  });

  it("preserves named roots through non-aggregate host projections", () => {
    class HostValue extends frame.Frame {}

    const makeMethod = (items: frame.Frame[]): frame.FrameLazy =>
      new frame.FrameLazy([new frame.FrameExpr(items)]);
    const makeService = (
      kind: "string" | "custom",
    ): {
      service: frame.Frame;
      methods: frame.FrameLazy[];
    } => {
      const local = makeMethod([frame.FrameSymbol.for("localValue")]);
      const file = makeMethod([
        frame.FrameScopeAnchor.file(),
        new frame.FrameName("fileValue"),
      ]);
      const explicit = makeMethod([
        frame.FrameScopeAnchor.host(),
        new frame.FrameName("hostValue"),
      ]);
      const implicit = makeMethod([frame.FrameSymbol.for("hostValue")]);
      const metadata: frame.Context = {
        localValue: new frame.FrameInt("7"),
        local,
        file,
        explicit,
        implicit,
      };
      const service = kind === "string"
        ? new frame.FrameString("service", metadata)
        : new HostValue(metadata);
      return { service, methods: [local, file, explicit, implicit] };
    };

    const stringService = makeService("string");
    const customService = makeService("custom");
    const nestedService = makeService("string");
    const cases: Array<{
      access: string;
      context: frame.Context;
      service: frame.Frame;
      methods: frame.FrameLazy[];
    }> = [
      {
        access: "$$.service",
        context: {
          hostValue: new frame.FrameInt("42"),
          service: stringService.service,
        },
        ...stringService,
      },
      {
        access: "$$.service",
        context: {
          hostValue: new frame.FrameInt("42"),
          service: customService.service,
        },
        ...customService,
      },
      {
        access: "$$.container.service",
        context: {
          hostValue: new frame.FrameInt("42"),
          container: new frame.FrameArray([], {
            service: nestedService.service,
          }),
        },
        ...nestedService,
      },
    ];

    for (const testCase of cases) {
      expect(
        evaluate(
          `${testCase.access}.local()`,
          testCase.context,
        ).at(0).toString(),
      ).toEqual("7");
      expect(
        evaluate(
          `.fileValue 1; ${testCase.access}.file()`,
          testCase.context,
        ).at(0).toString(),
      ).toEqual("((.fileValue 1); 1)");
      expect(
        evaluate(
          `${testCase.access}.explicit()`,
          testCase.context,
        ).at(0).toString(),
      ).toEqual("42");
      expect(
        evaluate(
          `${testCase.access}.implicit()`,
          testCase.context,
        ).at(0).toString(),
      ).toContain("$!.name-missing");
      expect(testCase.service.up).toBe(frame.Frame.missing);
      for (const method of testCase.methods) {
        expect(method.up).toBe(frame.Frame.missing);
      }
    }
  });

  it("keeps host bindings fixed while honoring mutable capabilities", () => {
    const capability = evaluate(
      ".counter_ [.value 1; .set_ {@value _;}];",
    ).meta.counter_;
    const context: frame.Context = { counter_: capability };
    const result = evaluate(
      "$$.counter_.set_ 9; $$.counter_.value",
      context,
    );

    expect(context.counter_).toBe(capability);
    expect(capability.get_here("value").toString()).toEqual("9");
    expect(result.at(0).toString()).toContain("9");
  });

  it("renders bare anchors without exposing namespace contents", () => {
    const context = make_context({ secret: "value" });

    expect(evaluate("$", context).at(0).toString()).toEqual("$");
    expect(evaluate("$$", context).at(0).toString()).toEqual("$$");
  });

  it("makes explicit namespace misses terminal", () => {
    const result = evaluate("$$.missing + 1");

    expect(result.at(0).is.error).toBe(true);
    expect(result.at(0).toString()).toEqual(
      "$!.name-missing $$.missing",
    );
  });

  it("reports invalid dollar forms instead of erasing expressions", () => {
    for (const source of ["$foo", "1 + $foo", "$$$", "$<", "$<<"]) {
      const result = evaluate(source);

      expect(result.length()).toEqual(1);
      expect(result.at(0).is.error).toBe(true);
      expect(result.at(0).toString()).toContain("invalid dollar form");
    }
  });

  it("updates file context on assignment", () => {
    const output = make_context({ x: "3" });
    const result = evaluate(".x 3;");
    expect(Object.keys(result.meta).sort()).toEqual(
      Object.keys(output).sort(),
    );
    for (const key of Object.keys(output)) {
      expect(result.meta[key].isEqualTo(output[key])).toBe(true);
    }
  });
});
