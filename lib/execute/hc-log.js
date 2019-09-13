"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
                console.log(hc_eval_1.HCEval.EXPECT + output);
            }
            else {
                console.log(output);
            }
        }
        return argument;
    }
}
exports.HCLog = HCLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTJDO0FBQzNDLHVDQUFtQztBQUluQyxNQUFhLEtBQU0sU0FBUSxjQUFLO0lBRTlCLFlBQVksT0FBZ0IsRUFBUyxTQUFrQixLQUFLO1FBQzFELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQURvQixXQUFNLEdBQU4sTUFBTSxDQUFpQjtJQUU1RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxVQUFVLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDbEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLEtBQUssS0FBSyxjQUFLLENBQUMsT0FBTyxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNwQztRQUNELElBQUksUUFBUSxLQUFLLGNBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFO1lBQ3pFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNuQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQzthQUNyQztpQkFBTTtnQkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3JCO1NBQ0Y7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0NBQ0Y7QUFyQkQsc0JBcUJDIn0=