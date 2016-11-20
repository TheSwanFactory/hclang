#!/usr/bin/env node
import { Frame } from "./frames/frame";

export { Frame };

const clear = require("clear");
const chalk = require("chalk");
const figlet = require("figlet");

clear();
console.log(
  chalk.green(
    figlet.textSync("MAML", { horizontalLayout: "full" })
  )
);
