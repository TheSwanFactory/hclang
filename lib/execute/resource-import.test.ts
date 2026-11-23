import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { MemoryStore } from "../frames.ts";
import { evaluate } from "./evaluate.ts";
import { HC_SOURCES } from "../bundle/hc-sources.ts";
import { rootContext } from "./resource-import.fixtures.test.ts";

describe("quoting a source as a closure (#443)", () => {
  /** Writes `files` to a fresh store and answers the last line's answer. */
  const quote = (files: Record<string, string>, expression: string): string => {
    const store = new MemoryStore();
    for (const [path, source] of Object.entries(files)) {
      store.write(path, source);
    }
    return evaluate(expression, rootContext(store)).at(-1).toString();
  };
  const file = [
    ".a 1",
    ".b (a + 1)",
    ".g (.a 5; a)",
    ".f {.a 9; a}",
    "'./out.txt' “written”",
    "[a, b, g, f ()]",
  ].join("\n");

  it("reads a file without running it, and runs it only when called", () => {
    expect(quote({ "f.hc": file }, ".q ('./f.hc' | {}); './out.txt' | “”"))
      .toContain("$!.resource-absent './out.txt'");
    expect(
      quote({ "f.hc": file }, ".q ('./f.hc' | {}); q (); './out.txt' | “”"),
    )
      .toContain("“written”");
  });

  it("answers, when called, the group of its lines' values", () => {
    // A file's lines are implicit commas, so the file is one comma
    // expression, and calling its quote answers that expression's group.
    expect(quote({ "f.hc": file }, "('./f.hc' | {}) ()")).toEqual(
      "(.a 1, .b 2, .g (.a 5; 5), .f { .a 9; a }, 7, [1, 2, (.a 5; 5), 9])",
    );
  });

  it("walks as the same text written as a closure", () => {
    const closure = `{${file}}`;
    expect(
      quote(
        { "f.hc": file },
        `(('./f.hc' | {}) & {“” _}) = (${closure} & {“” _})`,
      ),
    )
      .toEqual("<>");
    expect(quote({ "f.hc": file }, "('./f.hc' | {}) & {“” _}")).toContain(
      "“.g”, “(.a 5; a)”, “,”, “.f”, “{ .a 9; a }”",
    );
  });

  it("keeps recursion and shadowing inspectable", () => {
    const source = [
      ".fact {.n _; (n = 0) ? {1} : {n * (fact (n - 1))}}",
      ".a 1",
      ".g (.a 5; a)",
      "fact 5",
    ].join("\n");
    const walked = ".r ('./r.hc' | {}); .w (r & {_}); .gw ((w .7) & {_});";
    // The group's own `a` is its `.a`, not the file's.
    expect(
      quote(
        { "r.hc": source },
        `${walked} [(gw .3) === (gw .0), (gw .3) === (w .3)]`,
      ),
    )
      .toContain("; [<>, ()])");
    expect(quote({ "r.hc": source }, "('./r.hc' | {}) ()")).toContain("120)");
  });

  it("is stable under repeated reading, walking and calling", () => {
    expect(quote(
      { "f.hc": file },
      ".q ('./f.hc' | {}); .w1 (q & {“” _}); q (); [w1 = (q & {“” _}), w1 = (('./f.hc' | {}) & {“” _})]",
    )).toContain("; [<>, <>])");
  });

  it("reads what an import would run: no examples, and imports inert", () => {
    expect(quote({ "t.hc": "5\n; 1 + 1\n6\n" }, "('./t.hc' | {}) & {“” _}"))
      .toEqual("[“5”, “,”, “6”]");
    const fig = ". <- './figures.hc';\n[] * [[], []]";
    const figures = HC_SOURCES.get("hc/figures.hc")!;
    expect(quote(
      { "fig.hc": fig, "figures.hc": figures },
      ".fq ('./fig.hc' | {}); [(fq & {“” _}), (“” (fq ()))]",
    )).toContain(
      "[[“. <- './figures.hc'”, “;”, “[]”, “*”, “[[], []]”], “[]”])",
    );
  });

  it("answers the read's or the parse's failure", () => {
    expect(quote({}, "'./absent.hc' | {}")).toContain("$!.resource-absent");
    expect(quote({ "bad.hc": "(1, 2" }, "'./bad.hc' | {}")).toContain(
      "$!.parse-mismatched-structure",
    );
  });
});
