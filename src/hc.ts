#!/usr/bin/env node
// import { Frame, FrameString } from "./frames";

let input = "“Hello, MAML!”";
let argv = process.argv;
if (argv.length > 3) { input = argv[3]; };

console.log(input);
