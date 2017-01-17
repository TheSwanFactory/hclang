#!/usr/bin/env node

import { exec } from "./syntax";

let input = "“Hello, MAML!”";
let argv = process.argv;
if (argv.length > 3) { input = argv[3]; };

const output = exec(input);
console.log(output);
