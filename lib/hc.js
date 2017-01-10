#!/usr/bin/env node
"use strict";
var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");
clear();
var title = "HC";
var argv = process.argv;
if (argv.length > 2)
    title = process.argv[2];
console.log(chalk.green(figlet.textSync(title, { horizontalLayout: "full" })));
