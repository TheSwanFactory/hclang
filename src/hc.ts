#!/usr/bin/env node

import { execute } from "./execute";

let input = "“Hello, MAML!”";
const argv = process.argv;
if (argv.length > 3) {
  input = argv[3];
} else if (argv.length === 3) {
  const file = argv[2];
  console.log(file);
  input = file;
};

const output = execute(input);
console.log(output);
