#!/usr/bin/env node

import * as fs from "fs";
import * as getopts from "getopts";
import { execute } from "../execute";

let input = null;

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

if (input) {
  const output = execute(input);
  console.log(output);
}

if (options.interactive) {
  // start repl
}
