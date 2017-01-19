#!/usr/bin/env node
"use strict";
var syntax_1 = require("./syntax");
var input = "“Hello, MAML!”";
var argv = process.argv;
if (argv.length > 3) {
    input = argv[3];
}
;
var output = syntax_1.exec(input);
console.log(output);
