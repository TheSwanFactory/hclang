#!/usr/bin/env node
import { Frame, FrameString } from "./frames";

const clear = require("clear");
const chalk = require("chalk");
const figlet = require("figlet");

clear();

let title = "HC";
let argv = process.argv;
if (argv.length > 2) title = process.argv[2];

console.log(
  chalk.green(
    figlet.textSync(title, { horizontalLayout: "full" })
  )
);
