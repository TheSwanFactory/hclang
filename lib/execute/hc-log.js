"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
class HCLog extends frames_1.Frame {
    constructor(context, prompt = false) {
        super(context);
        this.prompt = prompt;
    }
    apply(argument, _parameter = frames_1.Frame.nil) {
        const debug = this.get("DEBUG");
        if (debug !== frames_1.Frame.missing) {
            console.log(argument.id, argument);
        }
        if (argument !== frames_1.Frame.nil && !argument.is.void && !argument.is.statement) {
            const output = argument.toString();
            if (this.prompt) {
                console.log(chalk_1.default.grey(hc_eval_1.HCEval.EXPECT + output));
            }
            else {
                console.log(output);
            }
        }
        return argument;
    }
}
exports.HCLog = HCLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsaUNBQTBCO0FBQzFCLHNDQUEyQztBQUMzQyx1Q0FBbUM7QUFJbkMsTUFBYSxLQUFNLFNBQVEsY0FBSztJQUU5QixZQUFZLE9BQWdCLEVBQVMsU0FBa0IsS0FBSztRQUMxRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFEb0IsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7SUFFNUQsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsVUFBVSxHQUFHLGNBQUssQ0FBQyxHQUFHO1FBQ2xELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxLQUFLLEtBQUssY0FBSyxDQUFDLE9BQU8sRUFBRTtZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDcEM7UUFDRCxJQUFJLFFBQVEsS0FBSyxjQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUN6RSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDbkMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBSyxDQUFDLElBQUksQ0FBQyxnQkFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQ2pEO2lCQUFNO2dCQUNMLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDckI7U0FDRjtRQUNELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQXJCRCxzQkFxQkMifQ==