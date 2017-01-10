#!/usr/bin/env node
var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");
clear();
console.log(chalk.green(figlet.textSync("MAML", { horizontalLayout: "full" })));
