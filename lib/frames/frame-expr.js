"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const meta_frame_1 = require("./meta-frame");
class FrameExpr extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
        data.forEach((item) => {
            item.up = this;
        });
    }
    in(contexts = [frame_1.Frame.nil]) {
        contexts.push(this);
        const result = this.data.reduce((sum, item) => {
            const value = item.in(contexts);
            const next_sum = sum.call(value);
            return next_sum;
        }, frame_1.Frame.nil);
        if (this.is.statement) {
            this.data = [result];
            return this;
        }
        return result;
    }
    call(argument, parameter = frame_1.Frame.nil) {
        return this.in([argument, parameter]);
    }
    ;
    toStringDataArray() {
        const array = this.data.map((obj) => obj.toString());
        return [array.join(' ') + ','];
    }
}
exports.FrameExpr = FrameExpr;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZXhwci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtZXhwci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUErQjtBQUMvQiw2Q0FBd0M7QUFDeEMsNkNBQXlDO0FBRXpDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RDLFlBQWEsSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDaEQsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDcEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUE7UUFDaEIsQ0FBQyxDQUFDLENBQUE7SUFDSixDQUFDO0lBRU0sRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQVUsRUFBRSxJQUFXLEVBQUUsRUFBRTtZQUMxRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQy9CLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDaEMsT0FBTyxRQUFRLENBQUE7UUFDakIsQ0FBQyxFQUFFLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUViLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUU7WUFDckIsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3BCLE9BQU8sSUFBSSxDQUFBO1NBQ1o7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFTSxJQUFJLENBQUUsUUFBZSxFQUFFLFNBQVMsR0FBRyxhQUFLLENBQUMsR0FBRztRQUNqRCxPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0lBQUEsQ0FBQztJQUVLLGlCQUFpQjtRQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQVUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUE7UUFDM0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUE7SUFDaEMsQ0FBQztDQUNGO0FBL0JELDhCQStCQztBQUFBLENBQUMifQ==