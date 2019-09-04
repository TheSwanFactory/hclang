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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBbUQ7QUFFbkQsTUFBYSxVQUFXLFNBQVEsc0JBQVM7SUFDdkMsWUFBWSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxRQUFRLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUNwQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVqQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUU7WUFDM0IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDbkIsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDTixPQUFPLGFBQUssQ0FBQyxHQUFHLENBQUM7YUFDbEI7WUFDRCxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNOLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNoQztTQUNGO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFDO1FBQzFELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBN0JELGdDQTZCQyJ9