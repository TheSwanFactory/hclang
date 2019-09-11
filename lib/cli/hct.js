#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getopts = require("getopts");
const _ = require("lodash");
const readline = require("readline");
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
    const rl = readline.createInterface(fs.createReadStream(file), process.stdout);
    rl.on("line", (line) => {
        output = hc_eval.call(line);
        if (!output.is.void) {
            console.log(hc_eval_1.HCEval.EXPECT + output.toString());
        }
    });
    evaluated = true;
});
if (options.interactive || !evaluated) {
    hc_eval.repl();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NsaS9oY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EseUJBQXlCO0FBQ3pCLG1DQUFtQztBQUNuQyw0QkFBNEI7QUFDNUIscUNBQXFDO0FBQ3JDLGdEQUE0QztBQUM1QyxnREFBNEM7QUFDNUMsc0NBQThDO0FBRTlDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUM3QyxLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUUsR0FBRztRQUNiLElBQUksRUFBRSxHQUFHO1FBQ1QsV0FBVyxFQUFFLEdBQUc7S0FDakI7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxtQkFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN4QyxNQUFNLElBQUksR0FBRyxJQUFJLGdCQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUN0QixJQUFJLE1BQWEsQ0FBQztBQUVsQixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQztDQUNsQjtBQUVELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQzFCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3JCLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNuQixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ2hEO0lBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ3JDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNoQiJ9