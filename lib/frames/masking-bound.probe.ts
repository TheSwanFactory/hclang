/**
 * SPIKE INSTRUMENTATION for a13c. Throwaway.
 *
 * Runs one source unit under every combination of masking rule, §6a setting,
 * and handler identity, so an attack is reported as a matrix rather than as a
 * single default. This is what produced the tables in a13d.
 *
 *     deno run --allow-all lib/frames/masking-bound.probe.ts -e '<statement>' …
 *     deno run --allow-all lib/frames/masking-bound.probe.ts -a '<statement>' …
 *
 * `-e` prints the matrix; `-a` prints every statement's value under the
 * defaults, which is how each corpus expectation was arrived at.
 */
import { evaluate } from "../execute/evaluate.ts";
import {
  FrameResource,
  MemoryStore,
  RESOURCE_ROOT_KEY,
  ResourceHandlers,
} from "../frames.ts";
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

const host = () => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(
    new MemoryStore(),
    ResourceHandlers.none,
  ),
});

export const runAll = (source: string): string[] => {
  resetRecovery();
  setRecoveryTripwire(4000);
  try {
    return evaluate(source + "\n", host()).toStringArray()
      .map((line) => line.replace(/[,;]$/, "").replace(/^\(|\)$/g, ""));
  } catch (error) {
    if (error instanceof RecoveryRunaway) return [`RUNAWAY: ${error.message}`];
    if (error instanceof RangeError) return [`RANGEERROR: ${error.message}`];
    throw error;
  }
};

export const run = (source: string): string => {
  const lines = runAll(source);
  return lines[lines.length - 1];
};

export const report = (label: string, source: string): void => {
  const answer = run(source);
  console.log(
    `${label.padEnd(30)} ${
      answer.padEnd(46)
    } calls=${recoveryCalls()} ids=${recoveryIdentityCount()} depth=${recoveryMaxDepth()}`,
  );
};

if (import.meta.main) {
  const [mode, ...rest] = Deno.args;
  if (mode === "-a") {
    for (const line of runAll(rest.join("\n"))) console.log(`  ${line}`);
    console.log(
      `  calls=${recoveryCalls()} ids=${recoveryIdentityCount()} depth=${recoveryMaxDepth()}`,
    );
  } else if (mode === "-e") {
    for (const guard of ["value", "key", "none"] as const) {
      for (const once of [true, false]) {
        for (const id of ["first-term", "object"] as const) {
          setRecoveryGuard(guard);
          setRecoveryOnce(once);
          setRecoveryIdentity(id);
          report(`${guard}/${once ? "once" : "every"}/${id}`, rest.join("\n"));
        }
      }
    }
  }
}
