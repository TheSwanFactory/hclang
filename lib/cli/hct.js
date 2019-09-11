#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getopts = require("getopts");
const _ = require("lodash");
const hc_eval_1 = require("../execute/hc-eval");
const hc_test_1 = require("../execute/hc-test");
const frames_1 = require("../frames");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: "e",
        help: "h",
        interactive: "i",
    },
});
const context = hc_eval_1.HCEval.make_context(process.env);
const out = new frames_1.FrameArray([], context);
const test = new hc_test_1.HCTest(out);
const hc_eval = new hc_eval_1.HCEval(test);
let evaluated = false;
let output;
if (options.evaluate) {
    output = hc_eval.call(options.evaluate);
    console.log(output.toString());
    evaluated = true;
}
_.each(options._, (file) => {
    output = hc_eval.call_file(file);
    console.log(out);
    evaluated = true;
});
if (options.interactive || !evaluated) {
    hc_eval.repl();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaS9oY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsbUNBQW1DO0FBQ25DLDRCQUE0QjtBQUM1QixnREFBNEM7QUFDNUMsZ0RBQTRDO0FBQzVDLHNDQUE4QztBQUc5QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO0tBQ2pCO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxPQUFPLEdBQUcsZ0JBQU0sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDeEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqQyxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7QUFDdEIsSUFBSSxNQUFhLENBQUM7QUFFbEIsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0lBQ3BCLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLFNBQVMsR0FBRyxJQUFJLENBQUM7Q0FDbEI7QUFFRCxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUMxQixNQUFNLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLFNBQVMsR0FBRyxJQUFJLENBQUM7QUFDbkIsQ0FBQyxDQUFDLENBQUM7QUFFSCxJQUFJLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLEVBQUU7SUFDckMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ2hCIn0=