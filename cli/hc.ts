import { HCEval, make_context } from "../lib/execute/hc-eval.ts";
import { HCLog } from "../lib/execute/hc-log.ts";
import { HCTest } from "../lib/execute/hc-test.ts";
import { parseArgs } from "@std/cli/parse-args";
import { runfile } from "./runfile.ts";
import { Prompt } from "./prompt.ts";
import { DenoFileStore } from "./resource-store.ts";
import {
  type Context,
  Frame,
  FrameResource,
  RESOURCE_ROOT_KEY,
  type StringMap,
} from "../lib/frames.ts";

/**
 * @module hc
 *
 * This is the main entry point for the hc command-line interface (CLI).
 */

/**
 * aliases to short form of command-line interface (CLI) options.
 */

const aliases = {
  e: "evaluate",
  h: "help",
  i: "interactive",
  t: "testdoc",
  v: "verbose",
  V: "version",
};

/**
 * Parses command-line arguments and returns the options.
 *
 * @param args - The array of command-line arguments (only).
 * @returns The parsed options object.
 */
export function getOptions(args: string[]): ReturnType<typeof parseArgs> {
  return parseArgs(args, {
    alias: aliases,
    boolean: ["help", "interactive", "testdoc", "verbose", "version"],
    string: ["evaluate"],
  });
}

/**
 * Creates and returns an instance of `HCEval` initialized with the provided environment variables.
 *
 * The host namespace also carries this harness's root binding, so a resource
 * identifier resolves against a fresh temp directory rather than against the
 * working directory. That is a narrowing: the process still holds whatever the
 * harness granted it, and the root binding is the ceiling the language enforces
 * inside it.
 *
 * @param env - An object containing key-value pairs of environment variables.
 * @param out - Optional output sink. Tests inject a capture frame; the CLI uses HCLog.
 * @returns An instance of `HCEval` configured with the provided environment variables.
 */
export function getEval(env: StringMap, out?: Frame): HCEval {
  const context = make_context(env);
  const output = out ?? new HCLog(context);
  return new HCEval(output, new Frame(), getHost(context));
}

/**
 * Builds this harness's host namespace, root binding included.
 *
 * Exported so a test can run a source unit under the authority the CLI actually
 * grants, rather than under an empty namespace that would make the resource
 * primitive invisible.
 *
 * @param context - Host bindings, which are copied rather than adopted.
 * @returns A frame reachable from HC source through `$$`.
 */
export function getHost(context: Context = {}): Frame {
  // Copied, because a Frame adopts the Context object it is handed and the
  // logger holds the same one: the root binding belongs to the host namespace
  // and nowhere else.
  const host = new Frame({ ...context });
  host.set(RESOURCE_ROOT_KEY, FrameResource.root(new DenoFileStore()));
  return host;
}

/**
 * The main function for the CLI application.
 *
 * @param hc_eval - An instance of HCEval.
 * @param options - The options object returned by the getOptions function.
 *
 * The function performs the following tasks:
 * - Logs the options if the verbose flag is set.
 * - Creates a context and output logger.
 * - Initializes the HCEval instance.
 * - If the testdoc option is set, initializes the HCTest instance and updates the HCEval instance.
 * - If the evaluate option is set, evaluates the provided code.
 * - Iterates over the files provided in the options and runs each file.
 * - If the interactive option is set or no evaluation has been performed, starts the REPL.
 */
export async function main(
  hcEval: HCEval,
  options: ReturnType<typeof getOptions>,
): Promise<number> {
  let evaluated = false;
  let sourceStarted = false;
  let lexicalComplete = true;
  let test: HCTest | undefined;

  if (options.verbose) {
    console.error("options", options);
  }

  if (options.testdoc) {
    test = new HCTest(hcEval.out);
    hcEval = hcEval.withOutput(test);
    evaluated = true;
  }

  const finishSource = (evaluator: HCEval): boolean => {
    const complete = evaluator.finish();
    if (!complete) {
      const reason = evaluator.error() ?? "incomplete lexical input";
      console.error(`HCEval.finish.failed: ${reason}`);
    }
    return complete;
  };

  if (options.evaluate) {
    sourceStarted = true;
    hcEval.call(options.evaluate.toString());
    evaluated = true;
    lexicalComplete = finishSource(hcEval);
  }

  for (const file of options._) {
    if (!lexicalComplete) break;
    if (typeof file !== "string") {
      console.error("Invalid file argument", file);
      continue;
    }

    if (sourceStarted) hcEval = hcEval.nextSourceUnit();
    sourceStarted = true;
    evaluated = await runfile(hcEval, file);
    lexicalComplete = finishSource(hcEval);
  }

  if (lexicalComplete && (options.interactive || !evaluated)) {
    if (sourceStarted) hcEval = hcEval.nextSourceUnit();
    sourceStarted = true;
    if (hcEval.out instanceof HCLog) hcEval.out.prompt = true;
    await new Prompt(hcEval).repl();
    lexicalComplete = finishSource(hcEval);
  }

  if (!sourceStarted) {
    lexicalComplete = finishSource(hcEval);
  }

  if (test && lexicalComplete) {
    test.finish();
  }

  return lexicalComplete ? test?.exitCode ?? 0 : 1;
}

if (import.meta.main) {
  const env = Deno.env.toObject();
  const options = getOptions(Deno.args);
  const hc_eval = getEval(env);
  main(hc_eval, options).then((exitCode) => {
    Deno.exit(exitCode);
  }).catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
