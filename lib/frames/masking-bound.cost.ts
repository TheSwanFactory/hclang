/**
 * SPIKE INSTRUMENTATION for a13c A6. Throwaway.
 *
 * Counts handler invocations for a *single* failure as the number of declining
 * handlers in scope grows, so "the bound holds" can be reported as a number
 * rather than as an absence of crashes.
 *
 *     deno run --allow-all lib/frames/masking-bound.cost.ts
 */
import { evaluate } from "../execute/evaluate.ts";
import {
  recoveryCalls,
  recoveryIdentityCount,
  recoveryMaxDepth,
  RecoveryRunaway,
  resetRecovery,
  setRecoveryGuard,
  setRecoveryIdentity,
  setRecoveryOnce,
  setRecoveryTripwire,
} from "./recovery.ts";

/** N nested scopes, each declaring one handler, one failure at the bottom. */
const nested = (levels: number, body: string, leaf = "(1 / 0)"): string => {
  let source = leaf;
  for (let level = 0; level < levels; level += 1) {
    source = `({.recover ${body}; ${source}} ())`;
  }
  return source + "\n";
};

/** The same, with the failure buried in redundant groups. */
const grouped = (levels: number, depth: number): string =>
  nested(levels, "{()}", `${"(".repeat(depth)}1 / 0${")".repeat(depth)}`);

/**
 * A chain built to maximise *nesting* rather than breadth: each handler's body
 * calls a helper that declares the next handler and fails, so handler N runs
 * inside handler N-1's call. This is the shape value masking exists to allow.
 */
const chained = (links: number): string => {
  let source = ".recover {(g1 ())};\n";
  for (let link = 1; link <= links; link += 1) {
    source += link < links
      ? `.g${link} {.recover {(g${link + 1} ())}; (1 / 0)};\n`
      : `.g${link} {(1 / 0)};\n`;
  }
  return source + "(1 / 0)\n";
};

const measure = (label: string, source: string): void => {
  resetRecovery();
  setRecoveryTripwire(400000);
  let answer = "";
  try {
    const lines = evaluate(source).toStringArray();
    answer = lines[lines.length - 1].replace(/[,;]$/, "");
  } catch (error) {
    answer = error instanceof RecoveryRunaway
      ? "RUNAWAY"
      : error instanceof RangeError
      ? "STACK OVERFLOW"
      : `threw ${(error as Error).constructor.name}`;
  }
  console.log(
    `${label.padEnd(38)} calls=${String(recoveryCalls()).padStart(6)} ids=${
      String(recoveryIdentityCount()).padStart(3)
    } depth=${String(recoveryMaxDepth()).padStart(3)}  ${answer.slice(0, 28)}`,
  );
};

if (import.meta.main) {
  setRecoveryIdentity("first-term");

  for (const once of [true, false]) {
    setRecoveryOnce(once);
    console.log(`\n§6a ${once ? "ON" : "OFF"}, value masking:`);
    setRecoveryGuard("value");
    for (const levels of [1, 2, 3, 4, 5, 6, 8, 10]) {
      measure(`${levels} nested declining handlers`, nested(levels, "{()}"));
    }
    console.log(`  handlers that fail on their own instead of answering nil:`);
    for (const levels of [1, 2, 3, 4, 5, 6]) {
      measure(`${levels} nested failing handlers`, nested(levels, "{1 / 0}"));
    }
    console.log(`  three handlers, failure buried in N redundant groups:`);
    for (const depth of [1, 2, 4, 8]) {
      measure(`3 handlers, group depth ${depth}`, grouped(3, depth));
    }
    console.log(`  handlers chained through helpers, to maximise depth:`);
    for (const links of [1, 2, 3, 4, 5, 6, 7, 8]) {
      measure(`${links} chained links`, chained(links));
    }
  }

  setRecoveryOnce(true);
  console.log(`\n§6a ON, value masking, object identity:`);
  setRecoveryIdentity("object");
  for (const levels of [1, 2, 3]) {
    measure(`${levels} nested declining handlers`, nested(levels, "{()}"));
  }
  setRecoveryIdentity("first-term");
}
