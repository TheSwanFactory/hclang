import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import * as frame from "../frames.ts";
import { FrameSymbol } from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";

describe("FrameSymbol", () => {
  const symbol = "atom";
  const frame_symbol = FrameSymbol.for(symbol);

  it("is created from a string", () => {
    expect(frame_symbol).toBeInstanceOf(FrameSymbol);
  });

  it("stringifies back to that string, because a bare symbol is a lookup", () => {
    expect(frame_symbol.toString()).toEqual(symbol);
  });

  it("stringifies an address with its dot, so output re-reads as input", () => {
    expect(FrameSymbol.address(symbol).toString()).toEqual(`.${symbol}`);
    expect(frame_symbol.setter(new frame.Frame()).toString())
      .toEqual(`.${symbol}`);
  });

  it("interns lookups only, so an address never marks the shared symbol", () => {
    FrameSymbol.address(symbol);

    expect(FrameSymbol.for(symbol).toString()).toEqual(symbol);
  });

  it("stringifies meta into an expression", () => {
    const context = "context";
    const frame_context = new FrameSymbol(context, { atom: frame_symbol });
    expect(frame_context.toString()).toEqual(`(${context}, .atom ${symbol};)`);
  });

  it("always returns the same FrameSymbol object", () => {
    const frame_symbol_2 = FrameSymbol.for(symbol);
    expect(frame_symbol).toEqual(frame_symbol_2);
  });

  it("looks itself up in context without re-parenting the binding", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", { atom: value });
    const result = frame_symbol.in([context]);

    expect(result).not.toBe(value);
    expect(result.toString()).toEqual(value.toString());
    expect(result.up).toBe(context);
    expect(value.up).toBe(frame.Frame.missing);
  });

  it("returns a per-read projection when called_by", () => {
    const value = new frame.FrameString("smasher");
    const context = new frame.FrameString("parent", { atom: value });
    const result = context.call(frame_symbol);

    expect(result).not.toBe(value);
    expect(result.toString()).toEqual(value.toString());
    expect(result.up).toBe(context);
    expect(value.up).toBe(frame.Frame.missing);
  });

  it("evaluates value when callme = true", () => {
    const value1 = new frame.FrameString("Atom ");
    const value2 = new frame.FrameString("Smasher");
    const expr = new frame.FrameExpr([value1, value2]);
    const context = new frame.FrameString("parent", { atom: expr });

    const result = context.call(frame_symbol);
    expect(result.toString()).toEqual("(“Atom ” “Smasher”)");

    expr.is.immediate = true;
    const result2 = context.call(frame_symbol);
    expect(result2.toString()).toEqual("“Atom Smasher”");
  });

  it("retrieves a schema from the owner of an inherited binding", () => {
    const schema = new frame.FrameSchema([new frame.FrameNumber("1")]);
    const owner = new frame.FrameArray([], {
      choice: new frame.FrameNumber("1"),
      "choice.<>": schema,
    });
    const child = new frame.FrameArray([]);
    child.setParent(owner);
    child.up = owner;

    expect(FrameSymbol.for("choice").bindingSchema([child])).toEqual(schema);
  });

  it("retrieves caller schema metadata through a named child closure", () => {
    const schema = new frame.FrameSchema([new frame.FrameNumber("1")]);
    const file = new frame.FrameArray([], {
      one: new frame.FrameNumber("1"),
      "one.<>": schema,
    });
    const namespace = new frame.FrameArray([]);
    const child = frame.EvaluationScope.root(file).namedChild(namespace);
    const call = frame.EvaluationScope.call(
      frame.Frame.nil,
      frame.Frame.nil,
      undefined,
      child,
    );

    expect(FrameSymbol.for("one").bindingSchema(child)).toBe(schema);
    expect(FrameSymbol.for("one").bindingSchema(call)).toBe(schema);
  });

  it("resolves a shadowed global's value and binding at the same caller layer", () => {
    const globalSchema = new frame.FrameSchema([new frame.FrameNumber("1")]);
    const layerSchema = new frame.FrameSchema([new frame.FrameNumber("2")]);
    const onlySchema = new frame.FrameSchema([new frame.FrameNumber("3")]);
    // A stand-in for Ops, so the shadowing does not depend on what Ops binds.
    const globals = new frame.FrameArray([], {
      shadowed: new frame.FrameNumber("1"),
      "shadowed.<>": globalSchema,
      globalOnly: new frame.FrameNumber("3"),
      "globalOnly.<>": onlySchema,
    });
    // The first caller layer declares nothing, and a later one shadows the
    // global, so a walk that reaches the globals early answers from them.
    const first = new frame.FrameArray([]);
    const layerValue = new frame.FrameNumber("2");
    const later = new frame.FrameArray([], {
      shadowed: layerValue,
      "shadowed.<>": layerSchema,
    });
    const namespace = new frame.FrameArray([]);

    const saved = frame.Frame.globals;
    frame.Frame.globals = globals;
    try {
      const child = frame.EvaluationScope.from([first, later])
        .namedChild(namespace);

      expect(namespace.get("shadowed")).toBe(layerValue);
      expect(namespace.resolve("shadowed")?.owner).toBe(later);
      expect(FrameSymbol.for("shadowed").bindingSchema(child)).toBe(
        layerSchema,
      );
      // A name no caller layer declares still resolves from the global tier.
      expect(namespace.resolve("globalOnly")?.owner).toBe(globals);
      expect(FrameSymbol.for("globalOnly").bindingSchema(child)).toBe(
        onlySchema,
      );
    } finally {
      frame.Frame.globals = saved;
    }
  });

  it("never re-parents a bound closure it reads (#424)", () => {
    // Reading `lower` inside the outer call used to point the inner closure's
    // `up` at that call, so the inner closure found the outer `lower`.
    expect(
      evaluate(
        ".Mk {.lower _; {[“level”, lower _]}}; .L0 {“base”}; (Mk (Mk L0)) 7",
      ).at(0).toString(),
    ).toContain("[“level”, [“level”, “base”]])");
  });

  it("renders a declaration's echo only when it is printed (#435)", () => {
    // Rendering at declaration spelled out the declared value every time, so a
    // closure that declared a large aggregate spent most of its time printing
    // text nobody read. The echo still spells the value when it is printed.
    let rendered = 0;
    class Counted extends frame.FrameAtom {
      protected override toData(): string {
        rendered++;
        return "counted";
      }
    }
    const scope = new frame.Frame();
    const echo = FrameSymbol.for("x").setter(scope).apply(
      new Counted(),
      frame.Frame.nil,
    );
    expect(rendered).toEqual(0);
    expect(echo.toString()).toEqual(".x counted");
    expect(rendered).toEqual(1);
    expect(echo.toString()).toEqual(".x counted");
    expect(rendered).toEqual(1);
  });

  it("holds a declared scope without a WeakRef, which a job keeps alive (#426)", () => {
    // Every WeakRef created during a job is kept alive until the job ends, and
    // the CLI runs a whole file as one job, so an echo holding its call scope
    // through one leaked that scope for the rest of the program.
    const Original = globalThis.WeakRef;
    let made = 0;
    globalThis.WeakRef = class<T extends WeakKey> extends Original<T> {
      constructor(target: T) {
        super(target);
        made++;
      }
    };
    try {
      const out = evaluate(
        ".f {.x _; .y [x, x]; [y, y]}; .z (f 1); [(f 2) .0, z]",
      );
      expect(out.at(0).toString()).toContain("[[2, 2], [[1, 1], [1, 1]]]");
    } finally {
      globalThis.WeakRef = Original;
    }
    expect(made).toEqual(0);
  });

  describe("size operators (#411)", () => {
    it("gives atoms explicit Count zero and gives text and URIs a Size", () => {
      for (const receiver of ["“abc”", "`abc`", "'./x.txt'"]) {
        expect(evaluate(`${receiver}.#`).at(0).toString()).toEqual("0");
        expect(evaluate(`${receiver}.##`).at(0).toString()).toEqual(
          receiver.startsWith("'") ? "1" : "3",
        );
      }
    });

    it("answers for a named value, never for the scope it was read in", () => {
      // A named atom looks other names up through that scope, which here is
      // an aggregate under construction with elements of its own: an array,
      // a group, and the file scope itself.
      expect(evaluate("[1, 2, .s “abc”; s.#, s.##]").at(0).toString())
        .toEqual("[.s “abc”; 1, 2, 0, 3]");
      expect(evaluate("(1, 2, .s “abc”; s.#, s.##)").at(0).toString())
        .toEqual("(.s “abc”; 1, 2, 0, 3)");
      expect(evaluate(".s “abc”; s.#").toString())
        .toEqual("[.s “abc”; ((.s “abc”); 0)]");
    });

    it("stays an address with no receiver before it", () => {
      // No enclosing aggregate counts in a missing receiver's place: not the
      // file scope, a group, an array, or a closure's argument.
      const table = [
        [".#", "[.#]"],
        ["(.#)", "[.#]"],
        ["1; .##", "[((1); .##)]"],
        ["(1, .#)", "[(1, .#)]"],
        ["[1, (2, .##)]", "[[1, (2, .##)]]"],
        ["{.#} (1, 2)", "[.#]"],
      ];
      for (const [source, printed] of table) {
        expect(evaluate(source).toString()).toEqual(printed);
      }
    });

    it("leaves the lexer's `#` a lookup, since only an address is one", () => {
      // The front end dispatches each source character by looking it up, and
      // there `#` selects the comment.
      const table = new frame.Frame({ "#": new frame.FrameString("comment") });

      expect(table.call(FrameSymbol.for("#")).toString()).toEqual("“comment”");
      expect(table.call(FrameSymbol.address("#")).toString()).toEqual("1");
    });
  });

  describe("setter", () => {
    const value = "value";
    const frame_value = new frame.FrameString(value);
    const out = new frame.FrameString("out");
    const setter = frame_symbol.setter(out);
    const result = setter.call(frame_value);

    it("has out parameter", () => {
      expect(setter.get(frame.Frame.kOUT)).toEqual(out);
    });

    it("returns a literal summary", () => {
      expect(result.toString()).toEqual(`.${symbol} “${value}”`);
    });

    it("sets value in out", () => {
      const extracted = out.get(symbol);
      expect(extracted).toEqual(frame_value);
    });
  });
});
