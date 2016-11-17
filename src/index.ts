#!/usr/bin/env node
import { Greeter } from "./greeter";

export { Greeter };

var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");

clear();
console.log(
  chalk.green(
    figlet.textSync('MAML', { horizontalLayout: 'full' })
  )
);
