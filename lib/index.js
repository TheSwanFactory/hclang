#!/usr/bin/env node
"use strict";
var frame_1 = require("./frames/frame");
exports.Frame = frame_1.Frame;
var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");
clear();
console.log(chalk.green(figlet.textSync("MAML", { horizontalLayout: "full" })));
