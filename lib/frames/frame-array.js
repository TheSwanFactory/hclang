"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const frame_note_1 = require("./frame-note");
const meta_frame_1 = require("./meta-frame");
class FrameArray extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_open() { return FrameArray.BEGIN_ARRAY; }
    ;
    string_close() { return FrameArray.END_ARRAY; }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        return this.array_eval(contexts);
    }
    apply(argument, parameter) {
        if (!argument.is.void) {
            this.data.push(argument);
        }
        return this;
    }
    at(index) {
        if (index >= this.size() || -index > this.size()) {
            const source = "[0.." + this.size() + "]." + index;
            return frame_note_1.FrameNote.index(source);
        }
        if (index >= 0) {
            return this.data[index];
        }
        const n = this.data.length;
        return this.data[n + index];
    }
    length() {
        return this.data.length;
    }
    reset() {
        this.data = [];
    }
}
exports.FrameArray = FrameArray;
FrameArray.BEGIN_ARRAY = "[";
FrameArray.END_ARRAY = "]";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBeUM7QUFDekMsNkNBQTBDO0FBRTFDLE1BQWEsVUFBVyxTQUFRLHNCQUFTO0lBSXZDLFlBQVksSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDL0MsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRU0sV0FBVyxLQUFLLE9BQU8sVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ2pELFlBQVksS0FBSyxPQUFPLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVoRCxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sRUFBRSxDQUFDLEtBQWE7UUFDckIsSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNoRCxNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7WUFDbkQsT0FBTyxzQkFBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNoQztRQUNELElBQUksS0FBSyxJQUFJLENBQUMsRUFBRTtZQUNkLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN6QjtRQUNELE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzNCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUNNLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQzFCLENBQUM7SUFFTSxLQUFLO1FBQ1YsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQzs7QUF2Q0gsZ0NBd0NDO0FBdkN3QixzQkFBVyxHQUFHLEdBQUcsQ0FBQztBQUNsQixvQkFBUyxHQUFHLEdBQUcsQ0FBQyJ9