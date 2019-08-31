"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_expr_1 = require("./frame-expr");
const meta_frame_1 = require("./meta-frame");
class FrameLazy extends frame_expr_1.FrameExpr {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_open() { return FrameLazy.LAZY_BEGIN; }
    ;
    string_close() { return FrameLazy.LAZY_END; }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        if (this.data.length === 0) {
            return this;
        }
        const expr = new frame_expr_1.FrameExpr(this.data, this.meta_for(contexts[0]));
        expr.up = this;
        return expr;
    }
    call(argument, parameter = frame_1.Frame.nil) {
        return new frame_expr_1.FrameExpr(argument.asArray(), this.meta_for(argument));
    }
    meta_for(context) {
        const MetaNew = this.meta_copy();
        const pairs = context.meta_pairs();
        pairs.map(([key, value]) => { MetaNew[key] = value; });
        return MetaNew;
    }
}
FrameLazy.LAZY_BEGIN = "{";
FrameLazy.LAZY_END = "}";
exports.FrameLazy = FrameLazy;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGF6eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBeUM7QUFDekMsNkNBQWtFO0FBRWxFLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBSXRDLFlBQVksSUFBa0IsRUFBRSxPQUFnQix1QkFBVTtRQUN4RCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxXQUFXLEtBQUssT0FBTyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDL0MsWUFBWSxLQUFLLE9BQU8sU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTlDLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzFCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLHNCQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZSxFQUFFLFNBQVMsR0FBRyxhQUFLLENBQUMsR0FBRztRQUNoRCxPQUFPLElBQUksc0JBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFUyxRQUFRLENBQUMsT0FBYztRQUMvQixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakMsTUFBTSxLQUFLLEdBQXlCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN6RCxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2RCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDOztBQTVCc0Isb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsa0JBQVEsR0FBRyxHQUFHLENBQUM7QUFGeEMsOEJBOEJDO0FBQUEsQ0FBQyJ9