import { expect } from "jsr:@std/expect@^0.219.1";
import { afterEach, describe, it } from "jsr:@std/testing@^1.0.10/bdd";

import {
  Frame,
  FrameResource,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
} from "../frames.ts";
import { evaluate } from "../execute/evaluate.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { EvaluationScope } from "./evaluation-scope.ts";
import {
  RECOVERY_KEY,
  recoveryCalls,
  type RecoveryGuard,
  type RecoverySite,
  resetRecovery,
  setRecoveryGuard,
  setRecoverySites,
} from "./recovery.ts";

/**
 * SPIKE TESTS for a13a. Throwaway, alongside the mechanism they pin.
 *
 * Each block is one of a13a §4's questions, and every assertion is output the
 * findings quote, so a13b can be checked against a run rather than trusted.
 *
 * Statements are separated by newlines, because a `;`-joined line is one
 * statement group whose rendering carries every earlier term.
 */

const host = () => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(
    new MemoryStore(),
    ResourceHandlers.none,
  ),
});

/** The rendered results of one source unit, one line per statement. */
const lines = (...statements: string[]): string[] =>
  evaluate(statements.join("\n") + "\n", host())
    .toStringArray()
    .map((line) => line.replace(/[,;]$/, ""));

/** The last statement's value, which is what an example is about. */
const last = (...statements: string[]): string => {
  const all = lines(...statements);
  return all[all.length - 1].replace(/^\(|\)$/g, "");
};

const withSites = <T>(sites: readonly RecoverySite[], body: () => T): T => {
  setRecoverySites(sites);
  try {
    return body();
  } finally {
    setRecoverySites(["term", "apply"]);
  }
};

const withGuard = <T>(guard: RecoveryGuard, body: () => T): T => {
  setRecoveryGuard(guard);
  try {
    return body();
  } finally {
    setRecoveryGuard("key");
  }
};

afterEach(() => {
  resetRecovery();
  setRecoveryGuard("key");
  setRecoverySites(["term", "apply"]);
});

describe("a13a Q1: which boundaries need the lookup", () => {
  it("recovers a parenthesized failure at a13 §6's site alone", () => {
    withSites(["term"], () => {
      expect(last(".recover {0};", "(1 / 0)")).toEqual("0");
    });
  });

  it("does not recover a bare `1 / 0` at a13 §6's site alone", () => {
    withSites(["term"], () => {
      expect(last(".recover {0};", "1 / 0")).toEqual("$!.division-by-zero /");
      expect(recoveryCalls()).toEqual(0);
    });
  });

  it("recovers it once the combination step is wired too", () => {
    withSites(["term", "apply"], () => {
      expect(last(".recover {0};", "1 / 0")).toEqual("0");
    });
  });

  it("needs no statement-sequence site: the statement no longer fails", () => {
    withSites(["term", "apply"], () => {
      expect(last(".f {.recover {0}; 1 / 0; “next”};", "f ()")).toEqual(
        "“next”",
      );
      expect(recoveryCalls()).toEqual(1);
    });
  });

  it("consults an answering handler once, however deep the failure was", () => {
    withSites(["term", "apply"], () => {
      expect(last(".recover {0};", "((1 / 0) + 5)")).toEqual("5");
      expect(recoveryCalls()).toEqual(1);
    });
  });

  it("re-runs a declining handler once per enclosing reduce", () => {
    withSites(["term", "apply"], () => {
      expect(last(".recover {()};", "(1 / 0)")).toEqual(
        "$!.division-by-zero /",
      );
      expect(recoveryCalls()).toEqual(4);
    });
  });

  it("and once more for each further level of nesting", () => {
    withSites(["term", "apply"], () => {
      expect(last(".recover {()};", "((1 / 0) + 5)")).toEqual(
        "$!.division-by-zero /",
      );
      expect(recoveryCalls()).toEqual(5);
    });
  });

  it("leaves nothing for the bound-method boundary to recover", () => {
    withSites(["term", "apply"], () => {
      expect(
        last(
          ".constant_ [.Value 1; .change_ {@Value _;}];",
          "{.recover {“handled”}; constant_.change_ 2} ()",
        ),
      ).toEqual("“handled”");
      expect(recoveryCalls()).toEqual(1);
    });
  });

  it("reaches the statement-sequence site only when nothing above answered", () => {
    withSites(["body"], () => {
      expect(last(".f {.recover {0}; 1 / 0; “next”};", "f ()")).toEqual(
        "“next”",
      );
      expect(recoveryCalls()).toEqual(1);
    });
  });
});

describe("a13a Q2: does the lookup itself recurse or fail", () => {
  it("answers a note, not an error, when no handler is declared", () => {
    const answer = FrameSymbol.for(RECOVERY_KEY).in(
      EvaluationScope.root(new Frame()),
    );
    expect(answer.is.note).toEqual(true);
    expect(answer.is.error).toBeUndefined();
    expect(answer.isFailedResult()).toEqual(false);
  });

  it("leaves an undeclared failure exactly as it was", () => {
    expect(last("1 / 0")).toEqual("$!.division-by-zero /");
    expect(recoveryCalls()).toEqual(0);
  });

  it("a bare missing name is not a failure, so nothing is consulted", () => {
    expect(last(".recover {0};", "nope-name")).toMatch(/^\$!\.name-missing/);
    expect(recoveryCalls()).toEqual(0);
  });
});

describe("a13a Q3: masking a self-failing handler", () => {
  it("recurses without bound when nothing masks the handler", () => {
    withGuard("none", () => {
      expect(() => lines(".recover {1 / 0};", "(1 / 0)")).toThrow(RangeError);
    });
  });

  it("terminates under value masking, and the original survives", () => {
    withGuard("value", () => {
      expect(last(".recover {1 / 0};", "(1 / 0)")).toEqual(
        "$!.division-by-zero /",
      );
    });
  });

  it("terminates under key masking too, and re-consults per enclosing reduce", () => {
    withGuard("key", () => {
      expect(last(".recover {1 / 0};", "(1 / 0)")).toEqual(
        "$!.division-by-zero /",
      );
      // Once inside the group's own reduce, then once more at each enclosing
      // reduce the unrecovered failure passes through.
      expect(recoveryCalls()).toEqual(4);
    });
  });

  it("nearest-wins needs no masking at all: neither guard is engaged", () => {
    for (const guard of ["value", "key"] as const) {
      withGuard(guard, () => {
        expect(
          last(
            ".recover {1 / 0};",
            ".f {.recover {“inner”}; (1 / 0)};",
            "(f ())",
          ),
        ).toEqual("“inner”");
      });
    }
  });

  it("value masking lets a handler's body be recovered by a different handler", () => {
    withGuard("value", () => {
      expect(
        last(
          ".recover {.g {.recover {“inner”}; (1 / 0)}; (g ())};",
          "(1 / 0)",
        ),
      ).toEqual("“inner”");
    });
  });

  it("key masking refuses that, so the original failure survives", () => {
    withGuard("key", () => {
      expect(
        last(
          ".recover {.g {.recover {“inner”}; (1 / 0)}; (g ())};",
          "(1 / 0)",
        ),
      ).toEqual("$!.division-by-zero /");
    });
  });

  it("terminates when the handler reads the binding that declared it", () => {
    expect(last(".recover {recover};", "(1 / 0)")).toEqual("{ recover }");
  });
});

describe("a13a Q4: is the handler visible as data", () => {
  it("prints in an aggregate's rendering, as a13's tutorial shows", () => {
    expect(last("[.recover {0}, 1]")).toEqual("[.recover { 0 }; 1]");
  });

  it("appears in visibleKeys, so a doubled stream carries it", () => {
    const aggregate = evaluate("[.recover {0}, 1]").at(0);
    expect(aggregate.visibleKeys()).toEqual([RECOVERY_KEY]);
  });

  it("is not an element, so a single stream leaves it out", () => {
    expect(last(".a [.recover {0}, 1];", "(a & {_})")).toEqual("[1]");
  });

  it("is not hidden from a doubled stream either", () => {
    expect(last(".a [.recover {0}, 1];", "(a && {_ .0})")).toEqual(
      "[.recover, .0]",
    );
  });
});

describe("a13a Q5: does collecting opt out", () => {
  it("holds the refusal when the seed collects, handler or not", () => {
    expect(last(".recover {7};", "('./nope.txt' | [])")).toEqual(
      "[$!.resource-absent './nope.txt']",
    );
    expect(recoveryCalls()).toEqual(0);
  });

  it("recovers when the seed joins", () => {
    expect(last(".recover {7};", "('./nope.txt' | “”)")).toEqual("7");
    expect(recoveryCalls()).toEqual(1);
  });
});

describe("a13a Q6: a13 §7's proposed rulings", () => {
  it("hands the refusal name over as text", () => {
    expect(last(".recover {_};", "(1 / 0)")).toEqual("“division-by-zero”");
    expect(last(".recover {_};", "('./nope.txt' | “”)")).toEqual(
      "“resource-absent”",
    );
  });

  it("lets a handler build a message from it", () => {
    expect(last(".recover {“caught: ” _};", "(1 / 0)")).toEqual(
      "“caught: division-by-zero”",
    );
  });

  it("declines on nil, and the original propagates", () => {
    expect(last(".recover {()};", "(1 / 0)")).toEqual("$!.division-by-zero /");
  });

  it("loses the reason inside a conditional branch, silently", () => {
    // IfThen calls the branch with nil, so `_` there is the branch's own empty
    // argument. Binding the reason to a name first is what works.
    expect(last(".recover {_ = “division-by-zero” ? {“saw ” _}};", "(1 / 0)"))
      .toEqual("“saw ”");
    expect(
      last(".recover {.r _; r = “division-by-zero” ? {“saw ” r}};", "(1 / 0)"),
    ).toEqual("“saw division-by-zero”");
  });

  it("declines on both inputs when one body fans out over two reasons", () => {
    const handler =
      ".recover {_ = “resource-absent” ? {“(defaults)”} : {_ = “division-by-zero” ? {0}}};";
    expect(last(handler, "('./nope.txt' | “”)")).toEqual(
      "$!.resource-absent './nope.txt'",
    );
    expect(last(handler, "(1 / 0)")).toEqual("$!.division-by-zero /");
  });

  it("needs more than one pattern, because the vocabulary is not one family", () => {
    expect(
      last(
        ".constant_ [.Value 1; .change_ {@Value _;}];",
        "{.recover {_}; constant_.change_ 2} ()",
      ),
    ).toEqual("“is-constant”");
  });

  it("spells a partial handler with the one operator that composes", () => {
    const handler = ".recover {_ = “resource-absent” ? {“(defaults)”}};";
    expect(last(handler, "('./nope.txt' | “”)")).toEqual("“(defaults)”");
    expect(last(handler, "(1 / 0)")).toEqual("$!.division-by-zero /");
  });
});
