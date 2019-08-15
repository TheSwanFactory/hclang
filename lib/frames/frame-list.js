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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQywrQ0FBMkM7QUFDM0MsNkNBQW1EO0FBTW5ELGVBQXVCLFNBQVEsYUFBSztJQUNsQyxZQUFzQixJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUN6RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFjO0lBRXhDLENBQUM7SUFFTSxpQkFBaUI7UUFDdEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLENBQUMsR0FBVSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUUsQ0FBQztJQUN6RCxDQUFDO0lBQUEsQ0FBQztJQUVLLGFBQWE7UUFDbEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDeEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sUUFBUTtRQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEYsQ0FBQztJQUVNLE9BQU87UUFDWixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sSUFBSTtRQUNULE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRVMsVUFBVSxDQUFDLFFBQXNCO1FBQ3pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsTUFBTSxDQUFDLElBQUksd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGO0FBakNELDhCQWlDQyJ9