"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
class HCLog extends frames_1.Frame {
    constructor(context) {
        super(context);
    }
    apply(argument, parameter = frames_1.Frame.nil) {
        const debug = this.get("DEBUG");
        if (debug !== frames_1.Frame.missing) {
            console.log(argument.id, argument);
        }
        if (argument != frames_1.Frame.nil && !argument.is.void && !argument.is.statement) {
            console.log(hc_eval_1.HCEval.EXPECT + argument.toString());
        }
        return argument;
    }
}
exports.HCLog = HCLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQW1FO0FBQ25FLHVDQUFtQztBQUluQyxNQUFhLEtBQU0sU0FBUSxjQUFLO0lBRTlCLFlBQVksT0FBZ0I7UUFDMUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBZSxFQUFFLFNBQVMsR0FBRyxjQUFLLENBQUMsR0FBRztRQUNqRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksS0FBSyxLQUFLLGNBQUssQ0FBQyxPQUFPLEVBQUU7WUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3BDO1FBQ0QsSUFBSSxRQUFRLElBQUksY0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUU7WUFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUNsRDtRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQWhCRCxzQkFnQkMifQ==