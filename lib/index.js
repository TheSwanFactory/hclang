"use strict";
var greeter_1 = require("./greeter");
exports.Greeter = greeter_1.Greeter;
var clear = require("clear");
var chalk = require("chalk");
var figlet = require("figlet");
clear();
console.log(chalk.green(figlet.textSync('MAML', { horizontalLayout: 'full' })));
