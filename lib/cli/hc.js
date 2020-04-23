#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const getopts = __importStar(require("getopts"));
const _ = __importStar(require("lodash"));
const readline = __importStar(require("readline"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY2xpL2hjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFDQSx1Q0FBd0I7QUFDeEIsaURBQWtDO0FBQ2xDLDBDQUEyQjtBQUMzQixtREFBb0M7QUFDcEMsZ0RBQTJDO0FBQzNDLDhDQUF5QztBQUN6QyxnREFBMkM7QUFFM0MsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQzdDLEtBQUssRUFBRTtRQUNMLFFBQVEsRUFBRSxHQUFHO1FBQ2IsSUFBSSxFQUFFLEdBQUc7UUFDVCxXQUFXLEVBQUUsR0FBRztRQUNoQixPQUFPLEVBQUUsR0FBRztRQUNaLE9BQU8sRUFBRSxHQUFHO0tBQ2I7Q0FDRixDQUFDLENBQUE7QUFDRixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7SUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUE7Q0FDbEM7QUFFRCxNQUFNLE9BQU8sR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUE7QUFDaEQsTUFBTSxHQUFHLEdBQUcsSUFBSSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7QUFDOUIsSUFBSSxPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO0FBQzdCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQTtBQUNyQixJQUFJLElBQVksQ0FBQTtBQUVoQixJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUU7SUFDbkIsSUFBSSxHQUFHLElBQUksZ0JBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUN0QixPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0NBQzNCO0FBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFBO0lBQ3pDLFNBQVMsR0FBRyxJQUFJLENBQUE7Q0FDakI7QUFFRCxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRTtJQUN6QixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNwRSxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQ3JCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDcEIsQ0FBQyxDQUFDLENBQUE7SUFDRixTQUFTLEdBQUcsSUFBSSxDQUFBO0FBQ2xCLENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsU0FBUyxFQUFFO0lBQ3JDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFBO0lBQ2pCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQTtDQUNmIn0=