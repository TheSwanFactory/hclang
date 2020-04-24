"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsK0JBQThCO0FBQzlCLHNDQUEwQztBQUMxQyx1Q0FBa0M7QUFJbEMsTUFBYSxLQUFNLFNBQVEsY0FBSztJQUM5QixZQUFhLE9BQWdCLEVBQVMsU0FBa0IsS0FBSztRQUMzRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUE7UUFEc0IsV0FBTSxHQUFOLE1BQU0sQ0FBaUI7SUFFN0QsQ0FBQztJQUVNLEtBQUssQ0FBRSxRQUFlLEVBQUUsVUFBVSxHQUFHLGNBQUssQ0FBQyxHQUFHO1FBQ25ELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDL0IsSUFBSSxLQUFLLEtBQUssY0FBSyxDQUFDLE9BQU8sRUFBRTtZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDbkM7UUFDRCxJQUFJLFFBQVEsS0FBSyxjQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUN6RSxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUE7WUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFBO2FBQ2hEO2lCQUFNO2dCQUNMLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7Z0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUE7YUFDdkI7U0FDRjtRQUNELE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFFTyxLQUFLLENBQUUsTUFBYztRQUMzQixJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDckIsT0FBTyxNQUFNLENBQUE7U0FDZDtRQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUN0QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2pDLFFBQVEsSUFBSSxFQUFFO1lBQ1osS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDbEUsS0FBSyxHQUFHLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDaEUsT0FBTyxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQ3JDO0lBQ0gsQ0FBQztDQUNGO0FBbENELHNCQWtDQyJ9