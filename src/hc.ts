#!/usr/bin/env node

import { execute } from "./execute";

let input = "“Hello, MAML!”";
const argv = process.argv;
if (argv.length > 3) { input = argv[3]; };

const output = execute(input);
console.log(output);
