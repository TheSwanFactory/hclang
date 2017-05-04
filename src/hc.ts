#!/usr/bin/env node

import * as fs from "fs";
import { execute } from "./execute";

let input = "“Hello, MAML!”";
const argv = process.argv;
if (argv.length > 3) {
  input = argv[3];
} else if (argv.length === 3) {
  const file = argv[2];
  input = fs.readFileSync(file, "utf8");
  // console.log(input);
};

const output = execute(input);
console.log(output);
