#!/usr/bin/env node

import * as fs from "fs";
import * as getopts from "getopts";
import * as prompt from "prompt-sync";
import { execute } from "../execute";

let input = "“Hello, MAML!”";

const options = getopts(process.argv.slice(2), {
  alias: {
    eval: "e",
    help: "h",
    interactive: "i",
  },
});

const files = options._;
if (files.length > 1) {
  input = fs.readFileSync(files[0], "utf8");
} else if (options.eval) {
  input = options.eval;
} else {
  options.interactive = true;
};

const output = execute(input);
console.log(output);
