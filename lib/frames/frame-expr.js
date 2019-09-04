"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const meta_frame_1 = require("./meta-frame");
class FrameExpr extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
        data.forEach((item) => { item.up = this; });
    }
    in(contexts = [frame_1.Frame.nil]) {
        contexts.push(this);
        const result = this.data.reduce((sum, item) => {
            const value = item.in(contexts);
            const next_sum = sum.call(value);
            return next_sum;
        }, frame_1.Frame.nil);
        if (this.is.statement) {
            result.is.statement = true;
        }
        return result;
    }
    call(argument, parameter = frame_1.Frame.nil) {
        return this.in([argument, parameter]);
    }
    ;
    toStringDataArray() {
        const array = super.toStringDataArray();
        return [array.join(" ")];
    }
}
exports.FrameExpr = FrameExpr;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZXhwci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtZXhwci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBeUM7QUFDekMsNkNBQTBDO0FBRTFDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RDLFlBQVksSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDL0MsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzlDLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBVSxFQUFFLElBQVcsRUFBRSxFQUFFO1lBQzFELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNoQyxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDLEVBQUUsYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRTtZQUNyQixNQUFNLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDNUI7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsYUFBSyxDQUFDLEdBQUc7UUFDaEQsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUFBLENBQUM7SUFFSyxpQkFBaUI7UUFDdEIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDeEMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMzQixDQUFDO0NBQ0Y7QUEzQkQsOEJBMkJDO0FBQUEsQ0FBQyJ9