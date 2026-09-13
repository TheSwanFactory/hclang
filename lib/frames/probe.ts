/**
 * SPIKE SCRATCH for a13c. Throwaway probe, deleted before the branch is pushed
 * if it stops being useful.
 *
 *     deno run --allow-all lib/frames/probe.ts
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

export const run = (source: string): string => {
  resetRecovery();
  setRecoveryTripwire(4000);
  try {
    const lines = evaluate(source + "\n", host()).toStringArray()
      .map((line) => line.replace(/[,;]$/, ""));
    return lines[lines.length - 1].replace(/^\(|\)$/g, "");
  } catch (error) {
    if (error instanceof RecoveryRunaway) return `RUNAWAY: ${error.message}`;
    if (error instanceof RangeError) return `RANGEERROR: ${error.message}`;
    throw error;
  }
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
  if (mode === "-e") {
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
