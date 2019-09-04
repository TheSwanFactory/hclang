"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_array_1 = require("./frame-array");
const meta_frame_1 = require("./meta-frame");
class FrameList extends frame_1.Frame {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
    }
    string_open() { return frame_1.Frame.BEGIN_EXPR; }
    ;
    string_close() { return frame_1.Frame.END_EXPR; }
    ;
    toStringDataArray() {
        return this.data.map((obj) => obj.toString());
    }
    ;
    toStringArray() {
        const result = this.toStringDataArray();
        if (this.meta_length() > 0) {
            result.push(this.meta_string());
        }
        return result;
    }
    toString() {
        return this.string_open() + this.toStringArray().join(", ") + this.string_close();
    }
    asArray() {
        return this.data;
    }
    size() {
        return this.data.length;
    }
    array_eval(contexts) {
        contexts.push(this);
        return new frame_array_1.FrameArray(this.data.map((f) => f.in(contexts)));
    }
}
exports.FrameList = FrameList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQywrQ0FBMkM7QUFDM0MsNkNBQW1EO0FBTW5ELE1BQWEsU0FBVSxTQUFRLGFBQUs7SUFDbEMsWUFBc0IsSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDekQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBYztJQUV4QyxDQUFDO0lBRU0sV0FBVyxLQUFLLE9BQU8sYUFBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQzNDLFlBQVksS0FBSyxPQUFPLGFBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUxQyxpQkFBaUI7UUFDdEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQVUsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUM7SUFDekQsQ0FBQztJQUFBLENBQUM7SUFFSyxhQUFhO1FBQ2xCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3hDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFBRTtZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1NBQ2pDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNwRixDQUFDO0lBRU0sT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sSUFBSTtRQUNULE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVTLFVBQVUsQ0FBQyxRQUFzQjtRQUN6QyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sSUFBSSx3QkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsQ0FBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFFLENBQUMsQ0FBQztJQUN2RSxDQUFDO0NBQ0Y7QUFwQ0QsOEJBb0NDIn0=