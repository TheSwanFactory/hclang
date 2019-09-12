"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class HCLog extends frames_1.Frame {
    constructor(context) {
        super(context);
    }
    apply(argument, _parameter = frames_1.Frame.nil) {
        const debug = this.get("DEBUG");
        if (debug !== frames_1.Frame.missing) {
            console.log(argument.id, argument);
        }
        if (argument !== frames_1.Frame.nil && !argument.is.void && !argument.is.statement) {
            console.log(argument.toString());
        }
        return argument;
    }
}
exports.HCLog = HCLog;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbG9nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvaGMtbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQTJDO0FBSTNDLE1BQWEsS0FBTSxTQUFRLGNBQUs7SUFFOUIsWUFBWSxPQUFnQjtRQUMxQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDakIsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsVUFBVSxHQUFHLGNBQUssQ0FBQyxHQUFHO1FBQ2xELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxLQUFLLEtBQUssY0FBSyxDQUFDLE9BQU8sRUFBRTtZQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDcEM7UUFDRCxJQUFJLFFBQVEsS0FBSyxjQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUN6RSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztDQUNGO0FBaEJELHNCQWdCQyJ9