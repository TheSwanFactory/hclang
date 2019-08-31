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
    string_open() { return "("; }
    ;
    string_close() { return ")"; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQywrQ0FBMkM7QUFDM0MsNkNBQW1EO0FBTW5ELE1BQWEsU0FBVSxTQUFRLGFBQUs7SUFDbEMsWUFBc0IsSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDekQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBYztJQUV4QyxDQUFDO0lBRU0sV0FBVyxLQUFLLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDOUIsWUFBWSxLQUFLLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFL0IsaUJBQWlCO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxHQUFVLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBRSxDQUFDO0lBQ3pELENBQUM7SUFBQSxDQUFDO0lBRUssYUFBYTtRQUNsQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUN4QyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLEVBQUU7WUFDMUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztTQUNqQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEYsQ0FBQztJQUVNLE9BQU87UUFDWixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVNLElBQUk7UUFDVCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzFCLENBQUM7SUFFUyxVQUFVLENBQUMsUUFBc0I7UUFDekMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixPQUFPLElBQUksd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFDLENBQUM7SUFDdkUsQ0FBQztDQUNGO0FBcENELDhCQW9DQyJ9