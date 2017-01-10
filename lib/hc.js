#!/usr/bin/env node
"use strict";
var clear = require("clear");
var chalk = require("chalk");
clear();
var InputPrompt = "; ";
var OutputPrompt = "# ";
var title = "hc";
var input = "“Hello, MAML!”";
var argv = process.argv;
if (argv.length > 2)
    input = argv[2];
var asInput = chalk.cyan;
var asOutput = chalk.cyan.inverse;
console.log(asInput(InputPrompt + input));
console.log(asOutput(OutputPrompt + input));
