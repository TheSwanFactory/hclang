#!/usr/bin/env node
let clear = require("clear");
let chalk = require("chalk");
let figlet = require("figlet");

clear();
console.log(
  chalk.green(
    figlet.textSync("MAML", { horizontalLayout: "full" }),
  ),
);
