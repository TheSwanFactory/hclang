/**
 * SPIKE INSTRUMENTATION for a13a Q7. Throwaway.
 *
 * The existing suite is too small and too dominated by process startup to show
 * the error branch's new scope walk, so this isolates it: the same source unit
 * run with the spike's sites off, on with nothing declared, and on with a
 * handler that answers or declines.
 *
 *     deno run --allow-all lib/frames/recovery.cost.ts
 */
import { evaluate } from "../execute/evaluate.ts";
import { recoveryCalls, resetRecovery, setRecoverySites } from "./recovery.ts";

const N = 2000;

const time = (label: string, source: string): void => {
  resetRecovery();
  // One warm run, then five measured, reported as the median.
  evaluate(source);
  const samples: number[] = [];
  for (let run = 0; run < 5; run += 1) {
    resetRecovery();
    const start = performance.now();
    evaluate(source);
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  console.log(
    label.padEnd(34),
    `median ${samples[2].toFixed(1)}ms`,
    `handler calls ${recoveryCalls()}`,
  );
};

if (import.meta.main) {
  const failures = Array.from({ length: N }, () => "(1 / 0)").join("\n") + "\n";
  const successes = Array.from({ length: N }, () => "(1 / 1)").join("\n") +
    "\n";

  setRecoverySites([]);
  time(`${N} failures, spike disabled`, failures);
  time(`${N} successes, spike disabled`, successes);

  setRecoverySites(["term", "apply"]);
  time(`${N} failures, no handler`, failures);
  time(`${N} failures, handler answers`, ".recover {0};\n" + failures);
  time(`${N} failures, handler declines`, ".recover {()};\n" + failures);
  time(`${N} successes, no handler`, successes);
  time(`${N} successes, handler declared`, ".recover {0};\n" + successes);
}
