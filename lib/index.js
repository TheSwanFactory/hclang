#!/usr/bin/env node
"use strict";
var frame_1 = require("./frame");
exports.Frame = frame_1.Frame;
var clear = require("clear");
var chalk = require("chalk");
var figlet_1 = require("figlet");
clear();
console.log(chalk.green(figlet_1.default.textSync("MAML", { horizontalLayout: "full" })));
