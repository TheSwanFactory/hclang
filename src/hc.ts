#!/usr/bin/env node
import { Frame, FrameString } from "./frames";

const clear = require("clear");
const chalk = require("chalk");

clear();

const InputPrompt = "; ";
const OutputPrompt  = "# ";

const title = "hc";
let input = "“Hello, MAML!”";
let argv = process.argv;
if (argv.length > 2) input = argv[2];

const asInput = chalk.cyan;
const asOutput = chalk.cyan.inverse;

console.log(
  asInput(InputPrompt + input)
);

console.log(
  asOutput(OutputPrompt + input)
);
