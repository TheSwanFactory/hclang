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
        evaluate: "e",
        help: "h",
        interactive: "i",
        testdoc: "t",
    },
});
console.error("options", options);
const context = hc_eval_1.HCEval.make_context(process.env);
const out = new hc_log_1.HCLog(context);
let hc_eval = new hc_eval_1.HCEval(out);
let evaluated = false;
if (options.testdoc) {
    const test = new hc_test_1.HCTest(out);
    hc_eval = new hc_eval_1.HCEval(test);
}
if (options.evaluate) {
    hc_eval.call(options.evaluate);
    evaluated = true;
}
_.each(options._, (file) => {
    const rl = readline.createInterface(fs.createReadStream(file), process.stdout);
    rl.on("line", (line) => {
        hc_eval.call(line);
    });
    evaluated = true;
});
if (options.interactive || !evaluated) {
    hc_eval.repl();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlCQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsNEJBQTRCO0FBQzVCLHFDQUFxQztBQUNyQyxnREFBNEM7QUFDNUMsOENBQTBDO0FBQzFDLGdEQUE0QztBQUc1QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDN0MsS0FBSyxFQUFFO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixJQUFJLEVBQUUsR0FBRztRQUNULFdBQVcsRUFBRSxHQUFHO1FBQ2hCLE9BQU8sRUFBRSxHQUFHO0tBQ2I7Q0FDRixDQUFDLENBQUM7QUFDSCxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNsQyxNQUFNLE9BQU8sR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUV0QixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7SUFDbkIsTUFBTSxJQUFJLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzdCLE9BQU8sR0FBRyxJQUFJLGdCQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDNUI7QUFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQztDQUNsQjtBQUVELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQzFCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ3JDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNoQiJ9