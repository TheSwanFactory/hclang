"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_expr_1 = require("./frame-expr");
const meta_frame_1 = require("./meta-frame");
class FrameGroup extends frame_expr_1.FrameExpr {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    eval_one(contexts = [frame_1.Frame.nil]) {
        contexts.push(this);
        const expr = this.data[0];
        const result = expr.in(contexts);
        if (expr.is.statement) {
            result.is.statement = true;
        }
        const symbols = this.meta_pairs();
        symbols.map(([key, value]) => {
            result.set(key, value);
        });
        return result;
    }
    in(contexts = [frame_1.Frame.nil]) {
        switch (this.size()) {
            case 0: {
                return frame_1.Frame.nil;
            }
            case 1: {
                return this.eval_one(contexts);
            }
        }
        this.data = this.data.map((f) => f.in(contexts));
        return this;
    }
}
exports.FrameGroup = FrameGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsTUFBYSxVQUFXLFNBQVEsc0JBQVM7SUFDdkMsWUFBWSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxRQUFRLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUNwQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFO1lBQ3JCLE1BQU0sQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztTQUM1QjtRQUVELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQixNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuQixLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNOLE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FBQzthQUNsQjtZQUNELEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ04sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2hDO1NBQ0Y7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFFLENBQUM7UUFDMUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFoQ0QsZ0NBZ0NDIn0=