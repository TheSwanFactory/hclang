#!/usr/bin/env node
import * as fs from "fs";
import * as getopts from "getopts";
import * as _ from "lodash";
import * as readline from "readline";
import { HCEval } from "../execute/hc-eval";
import { HCTest } from "../execute/hc-test";
import { Frame, FrameArray } from "../frames";

const options = getopts(process.argv.slice(2), {
  alias: {
    evaluate: "e",
    help: "h",
    interactive: "i",
  },
});

const context = HCEval.make_context(process.env);
const out = new FrameArray([], context);
const test = new HCTest(out);
const hc_eval = new HCEval(test);
let evaluated = false;
let output: Frame;

if (options.evaluate) {
  output = hc_eval.call(options.evaluate);
  console.log(output.toString());
  evaluated = true;
}

_.each(options._,  (file) => {
  const rl = readline.createInterface(fs.createReadStream(file), process.stdout);
  rl.on("line", (line) => {
    output = hc_eval.call(line);
    if (!output.is.void) {
      console.log(HCEval.EXPECT + output.toString());
    }
  });
  evaluated = true;
});

if (options.interactive || !evaluated) {
  hc_eval.repl();
}
