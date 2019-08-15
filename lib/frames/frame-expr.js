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
        return this.data.reduce((sum, item) => {
            const value = item.in(contexts);
            const next_sum = sum.call(value);
            return next_sum;
        }, frame_1.Frame.nil);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZXhwci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtZXhwci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUVoQyw2Q0FBeUM7QUFDekMsNkNBQW1EO0FBRW5ELGVBQXVCLFNBQVEsc0JBQVM7SUFDdEMsWUFBWSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVNLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBVSxFQUFFLElBQVcsRUFBRSxFQUFFO1lBQ2xELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEMsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNoQyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2xCLENBQUMsRUFBRSxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVNLElBQUksQ0FBQyxRQUFlLEVBQUUsU0FBUyxHQUFHLGFBQUssQ0FBQyxHQUFHO1FBQ2hELE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUFBLENBQUM7SUFFSyxpQkFBaUI7UUFDdEIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDeEMsTUFBTSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzNCLENBQUM7Q0FDRjtBQXZCRCw4QkF1QkM7QUFBQSxDQUFDIn0=