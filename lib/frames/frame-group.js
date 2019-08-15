"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const meta_frame_1 = require("./meta-frame");
class FrameGroup extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    in(contexts = [frame_1.Frame.nil]) {
        if (this.size() > 1) {
            return this.array_eval(contexts);
        }
        const expr = this.data[0];
        contexts.push(this);
        const result = expr.in(contexts);
        const symbols = this.meta_pairs();
        symbols.map(([key, value]) => {
            result.set(key, value);
        });
        return result;
    }
}
exports.FrameGroup = FrameGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsZ0JBQXdCLFNBQVEsc0JBQVM7SUFDdkMsWUFBWSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDakMsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ2xDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQzNCLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0Y7QUFsQkQsZ0NBa0JDIn0=