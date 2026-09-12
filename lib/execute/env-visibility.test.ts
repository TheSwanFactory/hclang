import { expect } from "jsr:@std/expect@^0.219.1";
import { describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import { VISIBLE_ENVIRONMENT, visibleEnvironment } from "./env-visibility.ts";
import { evaluate } from "./evaluate.ts";
import { make_context } from "./hc-eval.ts";

/** A process environment, as a reader over a fixed map. */
const reader = (entries: Record<string, string>) => (name: string) =>
  entries[name];

describe("visibleEnvironment", () => {
  it("passes only the variables the dictionary declares", () => {
    const read = reader({ HOME: "/home/x", SECRET_TOKEN: "leaked" });

    expect(visibleEnvironment(read)).toEqual({ HOME: "/home/x" });
  });

  it("reads one name at a time, never the whole environment", () => {
    const asked: string[] = [];
    const read = (name: string): string | undefined => {
      asked.push(name);
      return undefined;
    };

    visibleEnvironment(read, ["HOME", "TERM"]);
    expect(asked).toEqual(["HOME", "TERM"]);
  });

  it("omits a declared variable the host does not have", () => {
    expect(visibleEnvironment(reader({}), ["HOME"])).toEqual({});
  });

  it("treats a read the host refuses as absent, not as an error", () => {
    const read = (name: string): string | undefined => {
      if (name === "PATH") throw new Error('Requires env access to "PATH"');
      return name === "HOME" ? "/home/x" : undefined;
    };

    expect(visibleEnvironment(read, ["HOME", "PATH"])).toEqual({
      HOME: "/home/x",
    });
  });

  it("accepts a harness dictionary in place of the default", () => {
    const read = reader({ HOME: "/home/x", APP_MODE: "test" });

    expect(visibleEnvironment(read, ["APP_MODE"])).toEqual({
      APP_MODE: "test",
    });
  });

  it("keeps an empty value, because empty is not absent", () => {
    expect(visibleEnvironment(reader({ TERM: "" }), ["TERM"])).toEqual({
      TERM: "",
    });
  });
});

describe("VISIBLE_ENVIRONMENT", () => {
  it("names each variable once", () => {
    expect(new Set(VISIBLE_ENVIRONMENT).size).toEqual(
      VISIBLE_ENVIRONMENT.length,
    );
  });

  it("is frozen, so no importer can widen the default", () => {
    expect(Object.isFrozen(VISIBLE_ENVIRONMENT)).toBe(true);
  });

  it("covers the colour and debug variables this harness's code reads", () => {
    // Not the whole probe set: the CLI's dependency tree also reads a dozen
    // CI-vendor names to detect colour support, and those stay out because
    // detecting a vendor is the harness's business rather than a program's. They
    // reach the dependency through the unscoped flag, never through `$$`, which
    // is the point of the dictionary not being an `--allow-env` scope.
    for (const probed of ["TERM", "COLORTERM", "FORCE_COLOR", "NO_COLOR"]) {
      expect(VISIBLE_ENVIRONMENT).toContain(probed);
    }
    for (const probed of ["DEBUG", "DEBUG_ENV"]) {
      expect(VISIBLE_ENVIRONMENT).toContain(probed);
    }
  });
});

describe("a variable outside the dictionary", () => {
  it("is absent rather than refused, so there is nothing to probe", () => {
    const context = make_context(
      visibleEnvironment(reader({ HOME: "/home/x", SECRET_TOKEN: "leaked" })),
    );
    const rendered = (source: string): string =>
      evaluate(source, context).toStringArray()[0];

    // An undeclared variable and a typo answer the same thing, so a program
    // cannot learn from the difference that its host has the one it wanted.
    expect(rendered("$$.SECRET_TOKEN")).toEqual(
      "$!.name-missing $$.SECRET_TOKEN",
    );
    expect(rendered("$$.HOMD")).toEqual("$!.name-missing $$.HOMD");
    expect(rendered("$$.HOME")).toEqual("“/home/x”");
  });
});
