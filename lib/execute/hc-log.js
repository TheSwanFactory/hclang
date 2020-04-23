"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = __importStar(require("chalk"));
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
class HCLog extends frames_1.Frame {
    constructor(context, prompt = false) {
        super(context);
        this.prompt = prompt;
    }
    apply(argument, _parameter = frames_1.Frame.nil) {
        const debug = this.get('DEBUG');
        if (debug !== frames_1.Frame.missing) {
            console.log(argument.id, argument);
        }
        if (argument !== frames_1.Frame.nil && !argument.is.void && !argument.is.statement) {
            const output = argument.toString();
            if (this.prompt) {
                console.log(chalk.grey(hc_eval_1.HCEval.EXPECT + output));
            }
            else {
                const colorized = this.color(output);
                console.log(colorized);
            }
        }
        return argument;
    }
    color(output) {
        if (output[0] !== '$') {
            return output;
        }
        const flag = output[1];
        const part = output.split(' .n ');
        switch (flag) {
            case '+': return chalk.green(part[0]) + chalk.grey.italic(part[1]);
            case '-': return chalk.red(part[0]) + chalk.grey.italic(part[1]);
            default: return chalk.yellow(output);
        }
    }
}
exports.HCLog = HCLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDZDQUE4QjtBQUM5QixzQ0FBMEM7QUFDMUMsdUNBQWtDO0FBSWxDLE1BQWEsS0FBTSxTQUFRLGNBQUs7SUFDOUIsWUFBYSxPQUFnQixFQUFTLFNBQWtCLEtBQUs7UUFDM0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRHNCLFdBQU0sR0FBTixNQUFNLENBQWlCO0lBRTdELENBQUM7SUFFTSxLQUFLLENBQUUsUUFBZSxFQUFFLFVBQVUsR0FBRyxjQUFLLENBQUMsR0FBRztRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQy9CLElBQUksS0FBSyxLQUFLLGNBQUssQ0FBQyxPQUFPLEVBQUU7WUFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFBO1NBQ25DO1FBQ0QsSUFBSSxRQUFRLEtBQUssY0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUU7WUFDekUsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFBO1lBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDZixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQU0sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQTthQUNoRDtpQkFBTTtnQkFDTCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO2dCQUNwQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ3ZCO1NBQ0Y7UUFDRCxPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0lBRU8sS0FBSyxDQUFFLE1BQWM7UUFDM0IsSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ3JCLE9BQU8sTUFBTSxDQUFBO1NBQ2Q7UUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUNqQyxRQUFRLElBQUksRUFBRTtZQUNaLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xFLEtBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2hFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQTtTQUNyQztJQUNILENBQUM7Q0FDRjtBQWxDRCxzQkFrQ0MifQ==