/**
 * SPIKE INSTRUMENTATION for a13c's recommendation. Throwaway.
 *
 * A4 shows §9's masking and §6a's bookkeeping cannot share one identity. This
 * runs every attack under the split a13d recommends — masking on the parsed
 * body term, §6a on the closure instance — beside the two shared settings, so
 * the recommendation is a measurement rather than an argument.
 *
 *     deno run --allow-all lib/frames/split-identity.probe.ts
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
  type RecoveryIdentity,
  recoveryIdentityCount,
  recoveryMaxDepth,
  RecoveryRunaway,
  resetRecovery,
  setRecoveryGuard,
  setRecoveryIdentity,
  setRecoveryOnce,
  setRecoveryOnceIdentity,
  setRecoveryTripwire,
} from "./recovery.ts";

const host = () => ({
  [RESOURCE_ROOT_KEY]: FrameResource.root(
    new MemoryStore(),
    ResourceHandlers.none,
  ),
});

const attacks: Record<string, string> = {
  "A1 redeclared literal": ".f {.recover {(f ())}; (1 / 0)};\n(f ())\n",
  "A2 mutual recursion":
    ".recover {(g ())};\n.g {.recover {(h ())}; (1 / 0)};\n.h {(1 / 0)};\n(g ())\n",
  "A3 helper recursion":
    ".help {.recover {(help ())}; (1 / 0)};\n.recover {(help ())};\n(1 / 0)\n",
  "A4 two instances, one literal":
    ".mk {.k _; .recover {_ = k ? {“answered by ” k}}; " +
    "k = “division-by-zero” ? {(mk “resource-absent”)}; (1 / 0)};\n" +
    "(mk “division-by-zero”)\n",
  "A5 aggregate rebuilt": ".mk {[.recover {(mk ())}, 1 / 0]};\n(mk ())\n",
  "A6 eight chained handlers": chain(8),
  "nested recovery still works":
    ".recover {.g {.recover {“inner”}; (1 / 0)}; (g ())};\n(1 / 0)\n",
};

function chain(links: number): string {
  let source = ".recover {(g1 ())};\n";
  for (let link = 1; link <= links; link += 1) {
    source += link < links
      ? `.g${link} {.recover {(g${link + 1} ())}; (1 / 0)};\n`
      : `.g${link} {(1 / 0)};\n`;
  }
  return source + "(1 / 0)\n";
}

const measure = (source: string): string => {
  resetRecovery();
  setRecoveryTripwire(5000);
  let answer: string;
  try {
    const rendered = evaluate(source, host()).toStringArray();
    answer = rendered[rendered.length - 1].replace(/[,;]$/, "");
  } catch (error) {
    answer = error instanceof RecoveryRunaway
      ? "RUNAWAY"
      : error instanceof RangeError
      ? "STACK OVERFLOW"
      : `threw ${(error as Error).constructor.name}`;
  }
  return `${answer.slice(0, 30).padEnd(31)} calls=${
    String(recoveryCalls()).padStart(3)
  } ids=${String(recoveryIdentityCount()).padStart(3)} depth=${
    String(recoveryMaxDepth()).padStart(3)
  }`;
};

if (import.meta.main) {
  const settings: [string, RecoveryIdentity, RecoveryIdentity | undefined][] = [
    ["shared, parsed body term", "first-term", undefined],
    ["shared, closure instance", "object", undefined],
    ["split: mask term, offer instance", "first-term", "object"],
  ];
  setRecoveryGuard("value");
  setRecoveryOnce(true);
  for (const [label, maskIdentity, offerIdentity] of settings) {
    console.log(`\n${label}:`);
    setRecoveryIdentity(maskIdentity);
    setRecoveryOnceIdentity(offerIdentity);
    for (const [name, source] of Object.entries(attacks)) {
      console.log(`  ${name.padEnd(30)} ${measure(source)}`);
    }
  }
  setRecoveryIdentity("first-term");
  setRecoveryOnceIdentity(undefined);
}
