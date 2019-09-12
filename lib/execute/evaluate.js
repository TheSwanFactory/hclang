"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
exports.evaluate = (input) => {
    const out = new frames_1.FrameArray([]);
    const hc_eval = new hc_eval_1.HCEval(out);
    hc_eval.call(input);
    return out;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUEwRDtBQUMxRCx1Q0FBbUM7QUFFdEIsUUFBQSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQVMsRUFBRTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxJQUFJLG1CQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0IsTUFBTSxPQUFPLEdBQUcsSUFBSSxnQkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDcEIsT0FBTyxHQUFHLENBQUM7QUFDYixDQUFDLENBQUMifQ==