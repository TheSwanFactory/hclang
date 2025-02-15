#!/usr/bin/env node
import { HCEval } from "../execute/hc-eval.ts";
import { HCLog } from "../execute/hc-log.ts";
import { HCTest } from "../execute/hc-test.ts";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { runfile } from "./runfile.ts";

const aliases = {
  e: "evaluate",
  h: "help",
  i: "interactive",
  t: "testdoc",
  v: "verbose",
  V: "version",
};

const options = parseArgs(Deno.args.slice(2), {
  alias: aliases,
  boolean: ["help", "interactive", "testdoc", "verbose", "version"],
  string: ["evaluate"],
});

if (options.verbose) {
  console.error("options", options);
}

async function main() {
  const context = HCEval.make_context(Deno.env);
  const out = new HCLog(context);
  let hc_eval = new HCEval(out);
  let evaluated = false;
  let test: HCTest;

  if (options.testdoc) {
    test = new HCTest(out);
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
    out.prompt = true;
    hc_eval.repl();
  }
}

main().catch((err) => {
  console.error(err);
  Deno.exit(1);
});
