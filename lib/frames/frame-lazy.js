"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_expr_1 = require("./frame-expr");
const meta_frame_1 = require("./meta-frame");
class FrameLazy extends frame_expr_1.FrameExpr {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_open() { return FrameLazy.LAZY_BEGIN + " "; }
    ;
    string_close() { return " " + FrameLazy.LAZY_END; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGF6eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBeUM7QUFDekMsNkNBQWtFO0FBRWxFLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBSXRDLFlBQVksSUFBa0IsRUFBRSxPQUFnQix1QkFBVTtRQUN4RCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxXQUFXLEtBQUssT0FBTyxTQUFTLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3JELFlBQVksS0FBSyxPQUFRLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksc0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLElBQUksQ0FBQyxRQUFlLEVBQUUsU0FBUyxHQUFHLGFBQUssQ0FBQyxHQUFHO1FBQ2hELE9BQU8sSUFBSSxzQkFBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDcEUsQ0FBQztJQUVTLFFBQVEsQ0FBQyxPQUFjO1FBQy9CLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQyxNQUFNLEtBQUssR0FBeUIsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3pELEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7O0FBNUJzQixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixrQkFBUSxHQUFHLEdBQUcsQ0FBQztBQUZ4Qyw4QkE4QkM7QUFBQSxDQUFDIn0=