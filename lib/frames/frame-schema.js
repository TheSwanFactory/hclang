"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_list_1 = require("./frame-list");
const frame_note_1 = require("./frame-note");
const meta_frame_1 = require("./meta-frame");
class FrameSchema extends frame_list_1.FrameList {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(data, meta);
    }
    string_open() {
        return FrameSchema.BEGIN_SCHEMA;
    }
    ;
    string_close() {
        return FrameSchema.END_SCHEMA;
    }
    ;
    in(contexts = [frame_1.Frame.nil]) {
        const array = this.array_eval(contexts);
        return new FrameSchema(array);
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
exports.FrameSchema = FrameSchema;
FrameSchema.BEGIN_SCHEMA = '<';
FrameSchema.END_SCHEMA = '>';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBK0I7QUFDL0IsNkNBQXdDO0FBQ3hDLDZDQUF3QztBQUN4Qyw2Q0FBeUM7QUFFekMsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFJeEMsWUFBYSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUNoRCxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ25CLENBQUM7SUFFTSxXQUFXO1FBQ2hCLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQTtJQUNqQyxDQUFDO0lBQUEsQ0FBQztJQUVLLFlBQVk7UUFDakIsT0FBTyxXQUFXLENBQUMsVUFBVSxDQUFBO0lBQy9CLENBQUM7SUFBQSxDQUFDO0lBRUssRUFBRSxDQUFFLFFBQVEsR0FBRyxDQUFDLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUN2QyxPQUFPLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQy9CLENBQUM7SUFFTSxLQUFLLENBQUUsUUFBZSxFQUFFLFNBQWdCO1FBQzdDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtTQUN6QjtRQUNELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVNLEVBQUUsQ0FBRSxLQUFhO1FBQ3RCLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDaEQsTUFBTSxNQUFNLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFBO1lBQ2xELE9BQU8sc0JBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDL0I7UUFDRCxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7WUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDeEI7UUFDRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFBO0lBQzdCLENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtJQUN6QixDQUFDO0lBRU0sS0FBSztRQUNWLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFBO0lBQ2hCLENBQUM7O0FBOUNILGtDQStDQztBQTlDd0Isd0JBQVksR0FBRyxHQUFHLENBQUM7QUFDbkIsc0JBQVUsR0FBRyxHQUFHLENBQUMifQ==