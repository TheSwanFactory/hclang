"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_array_1 = require("./frame-array");
const meta_frame_1 = require("./meta-frame");
const stripLastComma = (result) => {
    if (!result || result.length < 1) {
        return result;
    }
    const n = result.length - 1;
    const last = result[n];
    const n_last = last.length - 1;
    if (last[n_last] === ",") {
        result[n] = last.substring(0, n_last);
    }
    return result;
};
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
        const result = this.data.map((obj) => {
            const sep = (obj.is.statement) ? ";" : ",";
            return obj.toString() + sep;
        });
        return result;
    }
    ;
    toStringArray() {
        const result = this.toStringDataArray();
        if (this.meta_length() > 0) {
            result.push(this.meta_string());
            return result;
        }
        return stripLastComma(result);
    }
    toString() {
        return this.string_open() + this.toStringArray().join(" ") + this.string_close();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQywrQ0FBMkM7QUFDM0MsNkNBQW1EO0FBTW5ELE1BQU0sY0FBYyxHQUFHLENBQUMsTUFBcUIsRUFBRSxFQUFFO0lBQy9DLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDaEMsT0FBTyxNQUFNLENBQUM7S0FDZjtJQUNELE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQzVCLE1BQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUMvQixJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLEVBQUU7UUFDeEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3ZDO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBRUYsTUFBYSxTQUFVLFNBQVEsYUFBSztJQUNsQyxZQUFzQixJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUN6RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFjO0lBRXhDLENBQUM7SUFFTSxXQUFXLEtBQUssT0FBTyxhQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDM0MsWUFBWSxLQUFLLE9BQU8sYUFBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFDLGlCQUFpQjtRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxDQUFDLEdBQVUsRUFBRSxFQUFFO1lBQzNDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDM0MsT0FBTyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDO1FBQzlCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUFBLENBQUM7SUFFSyxhQUFhO1FBQ2xCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ3hDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFBRTtZQUMxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLE9BQU8sTUFBTSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ25GLENBQUM7SUFFTSxPQUFPO1FBQ1osT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFTSxJQUFJO1FBQ1QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRVMsVUFBVSxDQUFDLFFBQXNCO1FBQ3pDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsT0FBTyxJQUFJLHdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUUsQ0FBQyxDQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7Q0FDRjtBQXpDRCw4QkF5Q0MifQ==