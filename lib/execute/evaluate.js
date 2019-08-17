"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_1 = require("./hc");
exports.evaluate = (input, context = frames_1.NilContext) => {
    const hc = new hc_1.HC(context);
    hc.evaluate(input);
    return hc;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUF1RDtBQUN2RCw2QkFBMEI7QUFFYixRQUFBLFFBQVEsR0FBRyxDQUFDLEtBQWEsRUFBRSxPQUFPLEdBQUcsbUJBQVUsRUFBUyxFQUFFO0lBQ3JFLE1BQU0sRUFBRSxHQUFHLElBQUksT0FBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzNCLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkIsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDLENBQUMifQ==