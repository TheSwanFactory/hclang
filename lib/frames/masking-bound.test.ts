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
import {
  recoveryCalls,
  type RecoveryGuard,
  type RecoveryIdentity,
  recoveryIdentityCount,
  recoveryMaxDepth,
  resetRecovery,
  setRecoveryGuard,
  setRecoveryIdentity,
  setRecoveryOnce,
  setRecoverySites,
  setRecoveryTripwire,
} from "./recovery.ts";

/**
 * SPIKE TESTS for a13c. Throwaway, alongside the mechanism they pin.
 *
 * Each block is one of a13c §4's attacks, plus §6's spelling check. Every
 * assertion is output the findings quote, so a13d can be checked against a run.
 */

const host = () => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(
    new MemoryStore(),
    ResourceHandlers.none,
  ),
});

const lines = (...statements: string[]): string[] =>
  evaluate(statements.join("\n") + "\n", host())
    .toStringArray()
    .map((line) => line.replace(/[,;]$/, ""));

const last = (...statements: string[]): string => {
  const all = lines(...statements);
  return all[all.length - 1].replace(/^\(|\)$/g, "");
};

const withIdentity = <T>(mode: RecoveryIdentity, body: () => T): T => {
  setRecoveryIdentity(mode);
  try {
    return body();
  } finally {
    setRecoveryIdentity("first-term");
  }
};

const withGuard = <T>(mode: RecoveryGuard, body: () => T): T => {
  setRecoveryGuard(mode);
  try {
    return body();
  } finally {
    setRecoveryGuard("value");
  }
};

const withoutOnce = <T>(body: () => T): T => {
  setRecoveryOnce(false);
  try {
    return body();
  } finally {
    setRecoveryOnce(true);
  }
};

afterEach(() => {
  resetRecovery();
  setRecoveryGuard("value");
  setRecoveryIdentity("first-term");
  setRecoveryOnce(true);
  setRecoverySites(["term", "apply"]);
  setRecoveryTripwire(0);
});

/**
 * One handler literal, re-declared on every call of the closure that holds it.
 * The shape every A1/A3/A5 attack reduces to.
 */
const REDECLARED = ".f {.recover {(f ())}; (1 / 0)};";

describe("a13c A1: mint templates at runtime", () => {
  it("mints one handler value per level when identity is the closure", () => {
    // The set of handler *values* is not fixed at all: one source literal
    // produced 180-odd of them before the stack ran out.
    withIdentity("object", () => {
      expect(() => lines(REDECLARED, "(f ())")).toThrow(RangeError);
      expect(recoveryIdentityCount()).toBeGreaterThan(100);
      expect(recoveryMaxDepth()).toEqual(recoveryIdentityCount());
    });
  });

  it("mints nothing when identity is the parsed body term", () => {
    expect(last(REDECLARED, "(f ())")).toEqual("$!.division-by-zero /");
    expect(recoveryIdentityCount()).toEqual(1);
    expect(recoveryMaxDepth()).toEqual(1);
  });

  it("answers one object for every read of one declaration", () => {
    // a13 §9 and a13b Q3 both say `FrameSymbol.in` hands out a fresh bound copy
    // per read, so identity cannot be the value. It does not: `FrameLazy.bind`
    // answers `this` for an already-bound closure, and a declared handler is
    // bound when its declaration is evaluated. Four reads, one object.
    withIdentity("object", () => {
      withoutOnce(() => {
        expect(last(".recover {()};", "(1 / 0)")).toEqual(
          "$!.division-by-zero /",
        );
        expect(recoveryCalls()).toEqual(4);
        expect(recoveryIdentityCount()).toEqual(1);
      });
    });
  });

  it("keeps one first term across every copy of one literal", () => {
    expect(last(REDECLARED, "(f ())")).toEqual("$!.division-by-zero /");
    expect(recoveryIdentityCount()).toEqual(1);
  });

  it("leaves a handler alone through instanceCopy, not just through copy", () => {
    // a13c A1 asks whether the object-semantic copy behaves like the plumbing
    // one here. It does, and for a stated reason: FrameLazy does not override
    // instanceCopy, because "closures are shared bodies" (frame.ts).
    const held = (frame: Frame): Frame | undefined =>
      frame.meta_pairs().find(([key]) => key === "recover")?.[1];
    const array = evaluate("[.recover {0}, 1]\n").at(0);
    const copied = held(array.instanceCopy());
    expect(held(array)).toBeDefined();
    expect(copied).toBe(held(array));
    expect(array.copy().asArray()[0]).toBe(array.asArray()[0]);
  });

  it("has one unstable identity, on a body that cannot fail", () => {
    // `template` falls back to the handler itself for an empty body, which is a
    // fresh object per level. It is unreachable as a hazard: `FrameLazy.call`
    // with no body codifies its argument, so an empty handler always answers.
    expect(last(".f {.recover {}; (1 / 0)};", "(f ())")).toEqual(
      "“division-by-zero”",
    );
    expect(recoveryCalls()).toEqual(1);
  });
});

describe("a13c A2: mutual recursion between two handlers", () => {
  const MUTUAL = [
    ".recover {(g ())};",
    ".g {.recover {(h ())}; (1 / 0)};",
    ".h {(1 / 0)};",
  ];

  it("terminates, with depth equal to the number of literals", () => {
    expect(last(...MUTUAL, "(g ())")).toEqual("$!.division-by-zero /");
    expect(recoveryIdentityCount()).toEqual(2);
    expect(recoveryMaxDepth()).toEqual(2);
  });

  it("releases the mask on return, not when the failure stops rising", () => {
    // The mask is a try/finally around `handler.call`, so a handler that
    // declines is unmasked while its own failure is still rising. Without §6a
    // it is therefore re-entered at every enclosing reduce: 36 calls for two
    // handlers. §6a is what stops that, not the mask.
    withoutOnce(() => {
      expect(last(...MUTUAL, "(g ())")).toEqual("$!.division-by-zero /");
      expect(recoveryCalls()).toEqual(36);
      expect(recoveryIdentityCount()).toEqual(2);
    });
    resetRecovery();
    expect(last(...MUTUAL, "(g ())")).toEqual("$!.division-by-zero /");
    expect(recoveryCalls()).toEqual(4);
  });
});

describe("a13c A3: recursion through a helper", () => {
  const HELPER = [
    ".help {.recover {(help ())}; (1 / 0)};",
    ".recover {(help ())};",
  ];

  it("terminates under the parsed-body-term identity", () => {
    expect(last(...HELPER, "(1 / 0)")).toEqual("$!.division-by-zero /");
    expect(recoveryMaxDepth()).toEqual(2);
  });

  it("diverges under the closure-value identity", () => {
    withIdentity("object", () => {
      expect(() => lines(...HELPER, "(1 / 0)")).toThrow(RangeError);
    });
  });
});

describe("a13c A4: §6a and the mask disagree", () => {
  // One handler literal reached at two nesting levels with different captures.
  // The outer instance would answer; the inner one declines.
  const TWO_INSTANCES = ".mk {.k _; .recover {_ = k ? {“answered by ” k}}; " +
    "k = “division-by-zero” ? {(mk “resource-absent”)}; (1 / 0)};";
  const CALL = "(mk “division-by-zero”)";

  it("loses a recovery that would otherwise have been made", () => {
    // §6a records the offer against the identity masking uses, so the outer
    // instance is skipped even though it is not masked and would have answered.
    expect(last(TWO_INSTANCES, CALL)).toEqual("$!.division-by-zero /");
    expect(recoveryCalls()).toEqual(1);
  });

  it("recovers with §6a off, so §6a is what lost it", () => {
    withoutOnce(() => {
      expect(last(TWO_INSTANCES, CALL)).toEqual(
        "“answered by division-by-zero”",
      );
      expect(recoveryCalls()).toEqual(6);
      expect(recoveryIdentityCount()).toEqual(1);
    });
  });

  it("recovers under the identity that tells the two instances apart", () => {
    withIdentity("object", () => {
      expect(last(TWO_INSTANCES, CALL)).toEqual(
        "“answered by division-by-zero”",
      );
      expect(recoveryIdentityCount()).toEqual(2);
    });
  });
});

describe("a13c A5: recursion through the aggregate path", () => {
  it("terminates when a literal's handler rebuilds the same literal", () => {
    expect(last(".mk {[.recover {(mk ())}, 1 / 0]};", "(mk ())")).toEqual(
      "[.recover { ((mk ((())))) }; $!.division-by-zero /]",
    );
    expect(recoveryCalls()).toEqual(1);
  });

  it("diverges under the closure-value identity", () => {
    withIdentity("object", () => {
      expect(() => lines(".mk {[.recover {(mk ())}, 1 / 0]};", "(mk ())"))
        .toThrow(RangeError);
    });
  });
});

describe("a13c A6: depth without divergence", () => {
  const nested = (levels: number): string => {
    let source = "(1 / 0)";
    for (let level = 0; level < levels; level += 1) {
      source = `({.recover {()}; ${source}} ())`;
    }
    return source;
  };

  const chained = (links: number): string[] => {
    const statements = [".recover {(g1 ())};"];
    for (let link = 1; link <= links; link += 1) {
      statements.push(
        link < links
          ? `.g${link} {.recover {(g${link + 1} ())}; (1 / 0)};`
          : `.g${link} {(1 / 0)};`,
      );
    }
    return statements;
  };

  it("costs one call per handler under §6a, however wide the nesting", () => {
    for (const levels of [1, 4, 10]) {
      resetRecovery();
      expect(last(nested(levels))).toEqual("$!.division-by-zero /");
      expect(recoveryCalls()).toEqual(levels);
      expect(recoveryMaxDepth()).toEqual(1);
    }
  });

  it("costs one call per handler under §6a, however deep the chain", () => {
    for (const links of [2, 4, 8]) {
      resetRecovery();
      expect(last(...chained(links), "(1 / 0)")).toEqual(
        "$!.division-by-zero /",
      );
      expect(recoveryCalls()).toEqual(links);
      expect(recoveryMaxDepth()).toEqual(links);
    }
  });

  it("costs 4^n calls for a chain of n handlers without §6a", () => {
    withoutOnce(() => {
      for (const [links, calls] of [[1, 4], [2, 20], [3, 84], [4, 340]]) {
        resetRecovery();
        expect(last(...chained(links), "(1 / 0)")).toEqual(
          "$!.division-by-zero /",
        );
        expect(recoveryCalls()).toEqual(calls);
        expect(recoveryIdentityCount()).toEqual(links);
      }
    });
  });

  it("is unaffected by masking style, because the guards agree here", () => {
    for (const mode of ["value", "key"] as const) {
      resetRecovery();
      withGuard(mode, () => {
        expect(last(nested(6))).toEqual("$!.division-by-zero /");
        expect(recoveryCalls()).toEqual(6);
      });
    }
  });
});

describe("a13c §6: does `__` reach the reason at every depth", () => {
  it("reaches it at the top of a handler body, spelled `_`", () => {
    expect(last(".recover {“saw ” _};", "(1 / 0)")).toEqual(
      "“saw division-by-zero”",
    );
  });

  it("reaches it inside one branch, spelled `__`, as a13 §7 claims", () => {
    expect(last(".recover {_ = “division-by-zero” ? {“saw ” __}};", "(1 / 0)"))
      .toEqual("“saw division-by-zero”");
  });

  it("does not reach it inside a branch of a branch", () => {
    expect(
      last(
        ".recover {_ = “division-by-zero” ? {(1 ? {“saw ” __})}};",
        "(1 / 0)",
      ),
    ).toEqual("“saw ”");
    expect(
      last(
        ".recover {_ = “division-by-zero” ? {(1 ? {“saw ” ___})}};",
        "(1 / 0)",
      ),
    ).toEqual("“saw division-by-zero”");
  });

  it("takes one level for an iterator callback too", () => {
    expect(last(".recover {([1] & {“saw ” __})};", "(1 / 0)")).toEqual(
      "[“saw division-by-zero”]",
    );
    // `_` there is the element, which is the silent wrong answer.
    expect(last(".recover {([1] & {“saw ” _})};", "(1 / 0)")).toEqual(
      "[“saw 1”]",
    );
  });

  it("takes two inside a branch inside an iterator callback", () => {
    expect(last(".recover {([1] & {1 ? {“saw ” __}})};", "(1 / 0)")).toEqual(
      "[“saw 1”]",
    );
    expect(last(".recover {([1] & {1 ? {“saw ” ___}})};", "(1 / 0)")).toEqual(
      "[“saw division-by-zero”]",
    );
  });

  it("does not reach it inside a helper the handler calls, at any spelling", () => {
    // The helper's enclosing scope is where the helper literal was evaluated,
    // which is the file scope, not the handler. `__` there answers the file
    // scope itself, so the handler reports the whole program as the reason.
    const answer = last(".show {“saw ” __};", ".recover {(show ())};", "1 / 0");
    expect(answer).toMatch(/^“saw \[\.show/);
    // Passing the reason as an argument is the spelling that works.
    expect(last(".show {“saw ” _};", ".recover {(show _)};", "1 / 0")).toEqual(
      "“saw division-by-zero”",
    );
  });

  it("over-counting fails as silently as under-counting", () => {
    expect(last(".recover {([1] & {1 ? {“saw ” ____}})};", "(1 / 0)"))
      .toMatch(/^\[“saw \[\.recover/);
  });
});

describe("a13c: the tripwire is measurement, not a guard", () => {
  it("reports a non-terminating attack instead of waiting for it", () => {
    setRecoveryTripwire(50);
    withGuard("none", () => {
      expect(() => lines(".recover {1 / 0};", "(1 / 0)")).toThrow();
    });
    expect(recoveryCalls()).toBeGreaterThan(50);
  });

  it("is never reached by any terminating case above", () => {
    setRecoveryTripwire(50);
    expect(last(REDECLARED, "(f ())")).toEqual("$!.division-by-zero /");
    expect(recoveryCalls()).toBeLessThan(50);
    expect(new Frame().is.error).toBeUndefined();
  });
});
