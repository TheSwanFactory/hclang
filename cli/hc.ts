#!/usr/bin/env -S deno run -A
import { HCEval, make_context } from "../lib/execute/hc-eval.ts";
import { HCLog } from "../lib/execute/hc-log.ts";
import { HCTest } from "../lib/execute/hc-test.ts";
import { parseArgs } from "@std/cli/parse-args";
import { runfile } from "./runfile.ts";
import { Prompt } from "./prompt.ts";
import type { StringMap } from "../lib/frames.ts";

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
  const hc_eval = new HCEval(out);
  return hc_eval;
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
  hc_eval: HCEval,
  options: ReturnType<typeof getOptions>,
): Promise<void> {
  const prompt = new Prompt(hc_eval);
  let evaluated = false;
  let test: HCTest;

  if (options.verbose) {
    console.error("options", options);
  }

  if (options.testdoc) {
    test = new HCTest(hc_eval.out);
    hc_eval = new HCEval(test);
    evaluated = true;
  }

  if (options.evaluate) {
    hc_eval.call(options.evaluate.toString());
    evaluated = true;
  }

  for (const file of options._) {
    if (typeof file === "string") {
      evaluated = await runfile(hc_eval, file);
    } else {
      console.error("Invalid file argument", file);
    }
  }

  if (options.interactive || !evaluated) {
    (hc_eval.out as HCLog).prompt = true;
    prompt.repl();
  }
}

const env = Deno.env.toObject();
const options = getOptions(Deno.args);
const hc_eval = getEval(env);
main(hc_eval, options).catch((err) => {
  console.error(err);
  Deno.exit(1);
});
