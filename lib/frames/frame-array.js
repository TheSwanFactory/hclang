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
        if (!argument.isVoid()) {
            this.data.push(argument);
        }
        return this;
    }
    at(index) {
        if (index >= this.size()) {
            const source = "[0.." + this.size() + "]." + index;
            return frame_note_1.FrameNote.index(source);
        }
        return this.data[index];
    }
    reset() {
        this.data = [];
    }
}
FrameArray.BEGIN_ARRAY = "[";
FrameArray.END_ARRAY = "]";
exports.FrameArray = FrameArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWdDO0FBQ2hDLDZDQUF5QztBQUN6Qyw2Q0FBeUM7QUFDekMsNkNBQTBDO0FBRTFDLGdCQUF3QixTQUFRLHNCQUFTO0lBSXZDLFlBQVksSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDL0MsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDO0lBRU0sV0FBVyxLQUFLLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDakQsWUFBWSxLQUFLLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFaEQsRUFBRSxDQUFDLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNCLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLEVBQUUsQ0FBQyxLQUFhO1FBQ3JCLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNuRCxNQUFNLENBQUMsc0JBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxLQUFLO1FBQ1YsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQzs7QUEvQnNCLHNCQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLG9CQUFTLEdBQUcsR0FBRyxDQUFDO0FBRnpDLGdDQWlDQyJ9