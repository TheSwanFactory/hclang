"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const meta_frame_1 = require("./meta-frame");
class FrameGroup extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    eval_one(contexts = [frame_1.Frame.nil]) {
        contexts.push(this);
        const expr = this.data[0];
        const result = expr.in(contexts);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQStCO0FBQy9CLDZDQUF3QztBQUN4Qyw2Q0FBa0Q7QUFFbEQsTUFBYSxVQUFXLFNBQVEsc0JBQVM7SUFDdkMsWUFBYSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNoRCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFFTSxRQUFRLENBQUUsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUNyQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ25CLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDekIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUVoQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUE7UUFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDeEIsQ0FBQyxDQUFDLENBQUE7UUFDRixPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFTSxFQUFFLENBQUUsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUMvQixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNuQixLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNOLE9BQU8sYUFBSyxDQUFDLEdBQUcsQ0FBQTthQUNqQjtZQUNELEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ04sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2FBQy9CO1NBQ0Y7UUFDRCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUE7UUFDdkQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0NBQ0Y7QUE3QkQsZ0NBNkJDIn0=