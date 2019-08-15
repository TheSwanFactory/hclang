"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class EvalPipe extends frames_1.Frame {
    constructor(out, meta = frames_1.NilContext) {
        super(meta);
        this.set(frames_1.Frame.kOUT, out);
        this.up = out;
    }
    apply(expr, context) {
        const out = this.get(frames_1.Frame.kOUT);
        const result = expr.in([out, context]);
        out.apply(result, context);
        return result;
    }
}
exports.EvalPipe = EvalPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbC1waXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvZXZhbC1waXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQXVEO0FBRXZELGNBQXNCLFNBQVEsY0FBSztJQUNqQyxZQUFZLEdBQVUsRUFBRSxPQUFnQixtQkFBVTtRQUNoRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDaEIsQ0FBQztJQUVNLEtBQUssQ0FBQyxJQUFXLEVBQUUsT0FBYztRQUN0QyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0Y7QUFiRCw0QkFhQyJ9