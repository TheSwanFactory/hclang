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
    string_open() {
        return FrameArray.BEGIN_ARRAY;
    }
    ;
    string_close() {
        return FrameArray.END_ARRAY;
    }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        const array = this.array_eval(contexts);
        return new FrameArray(array);
    }
    apply(argument, parameter) {
        if (!argument.is.void) {
            this.data.push(argument);
        }
        return this;
    }
    at(index) {
        if (index >= this.size() || -index > this.size()) {
            const source = '[0..' + this.size() + '].' + index;
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
FrameArray.BEGIN_ARRAY = '[';
FrameArray.END_ARRAY = ']';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWFycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQStCO0FBQy9CLDZDQUF3QztBQUN4Qyw2Q0FBd0M7QUFDeEMsNkNBQXlDO0FBRXpDLE1BQWEsVUFBVyxTQUFRLHNCQUFTO0lBSXZDLFlBQWEsSUFBa0IsRUFBRSxJQUFJLEdBQUcsdUJBQVU7UUFDaEQsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNuQixDQUFDO0lBRU0sV0FBVztRQUNoQixPQUFPLFVBQVUsQ0FBQyxXQUFXLENBQUE7SUFDL0IsQ0FBQztJQUFBLENBQUM7SUFFSyxZQUFZO1FBQ2pCLE9BQU8sVUFBVSxDQUFDLFNBQVMsQ0FBQTtJQUM3QixDQUFDO0lBQUEsQ0FBQztJQUVLLEVBQUUsQ0FBRSxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQy9CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDdkMsT0FBTyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQTtJQUM5QixDQUFDO0lBRU0sS0FBSyxDQUFFLFFBQWUsRUFBRSxTQUFnQjtRQUM3QyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7U0FDekI7UUFDRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxFQUFFLENBQUUsS0FBYTtRQUN0QixJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2hELE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQTtZQUNsRCxPQUFPLHNCQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1NBQy9CO1FBQ0QsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ3hCO1FBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBRU0sTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7SUFDekIsQ0FBQztJQUVNLEtBQUs7UUFDVixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUNoQixDQUFDOztBQTlDSCxnQ0ErQ0M7QUE5Q3dCLHNCQUFXLEdBQUcsR0FBRyxDQUFDO0FBQ2xCLG9CQUFTLEdBQUcsR0FBRyxDQUFDIn0=