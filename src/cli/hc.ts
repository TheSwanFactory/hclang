#!/usr/bin/env node

import * as fs from "fs";
import * as getopts from "getopts";
import * as prompt from "prompt-sync";
import { execute } from "../execute";

let input = "“Hello, MAML!”";
const argv = process.argv;
// console.log('argv' + argv);
if (argv.length > 3) {
  input = argv[3];
} else if (argv.length === 3) {
  const file = argv[2];
  input = fs.readFileSync(file, "utf8");
  console.log(input);
};

const output = execute(input);
console.log(output);
