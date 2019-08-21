"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_class_1 = require("./hc-class");
exports.evaluate = (input, context = frames_1.NilContext) => {
    const hc = new hc_class_1.HC(context);
    hc.evaluate(input);
    return hc;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUE4QztBQUM5Qyx5Q0FBZ0M7QUFFbkIsUUFBQSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsT0FBTyxHQUFHLG1CQUFVLEVBQVMsRUFBRTtJQUNyRSxNQUFNLEVBQUUsR0FBRyxJQUFJLGFBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMzQixFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25CLE9BQU8sRUFBRSxDQUFDO0FBQ1osQ0FBQyxDQUFDIn0=