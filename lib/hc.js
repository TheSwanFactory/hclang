#!/usr/bin/env node
var input = "“Hello, MAML!”";
var argv = process.argv;
if (argv.length > 3) {
    input = argv[3];
}
;
console.log(input);
