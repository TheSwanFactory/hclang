#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getopts = require("getopts");
const _ = require("lodash");
const readline = require("readline");
const hc_eval_1 = require("../execute/hc-eval");
const hc_log_1 = require("../execute/hc-log");
const hc_test_1 = require("../execute/hc-test");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: 'e',
        help: 'h',
        interactive: 'i',
        testdoc: 't',
        verbose: 'v'
    }
});
if (options.verbose) {
    console.error('options', options);
}
const context = hc_eval_1.HCEval.make_context(process.env);
const out = new hc_log_1.HCLog(context);
let hc_eval = new hc_eval_1.HCEval(out);
let evaluated = false;
let test;
if (options.testdoc) {
    test = new hc_test_1.HCTest(out);
    hc_eval = new hc_eval_1.HCEval(test);
}
if (options.evaluate) {
    hc_eval.call(options.evaluate.toString());
    evaluated = true;
}
_.each(options._, (file) => {
    const rl = readline.createInterface(fs.createReadStream(file), null);
    rl.on('line', (line) => {
        hc_eval.call(line);
    });
    evaluated = true;
});
if (options.interactive || !evaluated) {
    out.prompt = true;
    hc_eval.repl();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlCQUF3QjtBQUN4QixtQ0FBa0M7QUFDbEMsNEJBQTJCO0FBQzNCLHFDQUFvQztBQUNwQyxnREFBMkM7QUFDM0MsOENBQXlDO0FBQ3pDLGdEQUEyQztBQUUzQyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO1FBQ2hCLE9BQU8sRUFBRSxHQUFHO1FBQ1osT0FBTyxFQUFFLEdBQUc7S0FDYjtDQUNGLENBQUMsQ0FBQTtBQUNGLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtJQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQTtDQUNsQztBQUVELE1BQU0sT0FBTyxHQUFHLGdCQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNoRCxNQUFNLEdBQUcsR0FBRyxJQUFJLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUM5QixJQUFJLE9BQU8sR0FBRyxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDN0IsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFBO0FBQ3JCLElBQUksSUFBWSxDQUFBO0FBRWhCLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtJQUNuQixJQUFJLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0lBQ3RCLE9BQU8sR0FBRyxJQUFJLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDM0I7QUFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDekMsU0FBUyxHQUFHLElBQUksQ0FBQTtDQUNqQjtBQUVELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO0lBQ3pCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3BFLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDckIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUNwQixDQUFDLENBQUMsQ0FBQTtJQUNGLFNBQVMsR0FBRyxJQUFJLENBQUE7QUFDbEIsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDckMsR0FBRyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUE7SUFDakIsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFBO0NBQ2YifQ==