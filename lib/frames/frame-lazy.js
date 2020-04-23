"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_expr_1 = require("./frame-expr");
const meta_frame_1 = require("./meta-frame");
class FrameLazy extends frame_expr_1.FrameExpr {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_open() {
        return FrameLazy.LAZY_BEGIN;
    }
    ;
    string_close() {
        return FrameLazy.LAZY_END;
    }
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
        pairs.map(([key, value]) => {
            MetaNew[key] = value;
        });
        return MetaNew;
    }
}
exports.FrameLazy = FrameLazy;
FrameLazy.LAZY_BEGIN = '{';
FrameLazy.LAZY_END = '}';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGF6eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQjtBQUMvQiw2Q0FBd0M7QUFDeEMsNkNBQWlFO0FBRWpFLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBSXRDLFlBQWEsSUFBa0IsRUFBRSxPQUFnQix1QkFBVTtRQUN6RCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFFTSxXQUFXO1FBQ2hCLE9BQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQTtJQUM3QixDQUFDO0lBQUEsQ0FBQztJQUVLLFlBQVk7UUFDakIsT0FBTyxTQUFTLENBQUMsUUFBUSxDQUFBO0lBQzNCLENBQUM7SUFBQSxDQUFDO0lBRUssRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUE7U0FDWjtRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksc0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNqRSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQTtRQUNkLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVNLElBQUksQ0FBRSxRQUFlLEVBQUUsU0FBUyxHQUFHLGFBQUssQ0FBQyxHQUFHO1FBQ2pELE9BQU8sSUFBSSxzQkFBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7SUFDbkUsQ0FBQztJQUVTLFFBQVEsQ0FBRSxPQUFjO1FBQ2hDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNoQyxNQUFNLEtBQUssR0FBeUIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFBO1FBQ3hELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQ3pCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUE7UUFDdEIsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDOztBQXBDSCw4QkFxQ0M7QUFwQ3dCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGtCQUFRLEdBQUcsR0FBRyxDQUFDO0FBbUN2QyxDQUFDIn0=