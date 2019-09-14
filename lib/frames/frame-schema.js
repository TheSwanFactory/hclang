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
    string_open() { return FrameSchema.BEGIN_SCHEMA; }
    ;
    string_close() { return FrameSchema.END_SCHEMA; }
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
exports.FrameSchema = FrameSchema;
FrameSchema.BEGIN_SCHEMA = "<";
FrameSchema.END_SCHEMA = ">";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zY2hlbWEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLDZDQUF5QztBQUN6Qyw2Q0FBMEM7QUFFMUMsTUFBYSxXQUFZLFNBQVEsc0JBQVM7SUFJeEMsWUFBWSxJQUFrQixFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMvQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BCLENBQUM7SUFFTSxXQUFXLEtBQUssT0FBTyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDbkQsWUFBWSxLQUFLLE9BQU8sV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRWxELEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDMUI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxFQUFFLENBQUMsS0FBYTtRQUNyQixJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ2hELE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztZQUNuRCxPQUFPLHNCQUFTLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO1FBQ0QsSUFBSSxLQUFLLElBQUksQ0FBQyxFQUFFO1lBQ2QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pCO1FBQ0QsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBQ00sTUFBTTtRQUNYLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVNLEtBQUs7UUFDVixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDOztBQXhDSCxrQ0F5Q0M7QUF4Q3dCLHdCQUFZLEdBQUcsR0FBRyxDQUFDO0FBQ25CLHNCQUFVLEdBQUcsR0FBRyxDQUFDIn0=