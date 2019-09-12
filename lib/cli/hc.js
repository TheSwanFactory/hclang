#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const getopts = require("getopts");
const _ = require("lodash");
const readline = require("readline");
const hc_eval_1 = require("../execute/hc-eval");
const hc_log_1 = require("../execute/hc-log");
const options = getopts(process.argv.slice(2), {
    alias: {
        evaluate: "e",
        help: "h",
        interactive: "i",
    },
});
const context = hc_eval_1.HCEval.make_context(process.env);
const out = new hc_log_1.HCLog(context);
const hc_eval = new hc_eval_1.HCEval(out);
let evaluated = false;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLHlCQUF5QjtBQUN6QixtQ0FBbUM7QUFDbkMsNEJBQTRCO0FBQzVCLHFDQUFxQztBQUNyQyxnREFBNEM7QUFDNUMsOENBQTBDO0FBSTFDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtJQUM3QyxLQUFLLEVBQUU7UUFDTCxRQUFRLEVBQUUsR0FBRztRQUNiLElBQUksRUFBRSxHQUFHO1FBQ1QsV0FBVyxFQUFFLEdBQUc7S0FDakI7Q0FDRixDQUFDLENBQUM7QUFFSCxNQUFNLE9BQU8sR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakQsTUFBTSxHQUFHLEdBQUcsSUFBSSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztBQUV0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLEVBQUU7SUFDcEIsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0IsU0FBUyxHQUFHLElBQUksQ0FBQztDQUNsQjtBQUVELENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRyxDQUFDLElBQUksRUFBRSxFQUFFO0lBQzFCLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMvRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDSCxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ25CLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ3JDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNoQiJ9