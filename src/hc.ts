#!/usr/bin/env node
import { Frame, FrameString } from "./frames";

const clear = require("clear");
const chalk = require("chalk");
const figlet = require("figlet");

clear();
console.log(
  chalk.green(
    figlet.textSync("HC", { horizontalLayout: "full" })
  )
);
