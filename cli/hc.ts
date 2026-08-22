#!/usr/bin/env -S deno run -A
import { HCEval, make_context } from "../lib/execute/hc-eval.ts";
import { HCLog } from "../lib/execute/hc-log.ts";
import { HCTest } from "../lib/execute/hc-test.ts";
import { parseArgs } from "@std/cli/parse-args";
import { runfile } from "./runfile.ts";
import { Prompt } from "./prompt.ts";
import { Frame, type StringMap } from "../lib/frames.ts";

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
 * @param env - An object containing key-value pairs of environment variables.
 * @returns An instance of `HCEval` configured with the provided environment variables.
 */
export function getEval(env: StringMap): HCEval {
  const context = make_context(env);
  const out = new HCLog(context);
  const fileScope = new Frame();
  const hostNamespace = new Frame(context);
  return new HCEval(out, fileScope, hostNamespace);
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
    Deno.exitCode = exitCode;
  }).catch((err) => {
    console.error(err);
    Deno.exit(1);
  });
}
