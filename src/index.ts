#!/usr/bin/env node
let clear = require("clear");
let chalk = require("chalk");
let figlet = require("figlet");
export * from "./frames";
export * from "./maml";
export * from "./syntax";

clear();
console.log(
  chalk.green(
    figlet.textSync("MAML", { horizontalLayout: "full" }),
  ),
);
