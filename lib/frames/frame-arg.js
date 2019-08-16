"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_note_1 = require("./frame-note");
const frame_symbol_1 = require("./frame-symbol");
class FrameArg extends frame_symbol_1.FrameSymbol {
    constructor(data) {
        super(data);
    }
    static here() {
        return FrameArg.level();
    }
    static level(count = 1) {
        const symbol = Array(count + 1).join(FrameArg.ARG_CHAR);
        return FrameArg._for(symbol);
    }
    static _for(symbol) {
        const exists = FrameArg.args[symbol];
        return exists || (FrameArg.args[symbol] = new FrameArg(symbol));
    }
    in(contexts = [frame_1.Frame.nil]) {
        const level = this.data.length;
        if (level <= 1) {
            return contexts[0];
        }
        else {
            return FrameArg.level(level - 1);
        }
    }
}
FrameArg.ARG_CHAR = "_";
FrameArg.args = {};
exports.FrameArg = FrameArg;
;
class FrameParam extends frame_symbol_1.FrameSymbol {
    constructor(data) {
        super(data);
    }
    static there() {
        return FrameParam.level();
    }
    static level(count = 1) {
        const symbol = FrameArg.ARG_CHAR + Array(count + 1).join(FrameParam.ARG_CHAR);
        return FrameParam._for(symbol);
    }
    static _for(symbol) {
        const exists = FrameParam.params[symbol];
        return exists || (FrameParam.params[symbol] = new FrameParam(symbol));
    }
    in(contexts = [frame_1.Frame.nil]) {
        const level = this.data.length - 1;
        if (level <= contexts.length) {
            return contexts[level];
        }
        else {
            return frame_note_1.FrameNote.key(this.data);
        }
    }
}
FrameParam.ARG_CHAR = "^";
FrameParam.params = {};
exports.FrameParam = FrameParam;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYXJnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1hcmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBZ0M7QUFDaEMsNkNBQXlDO0FBQ3pDLGlEQUE2QztBQUU3QyxNQUFhLFFBQVMsU0FBUSwwQkFBVztJQW1CdkMsWUFBc0IsSUFBWTtRQUNoQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDZCxDQUFDO0lBbEJNLE1BQU0sQ0FBQyxJQUFJO1FBQ2hCLE9BQU8sUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO1FBQzNCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4RCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0IsQ0FBQztJQUlTLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYztRQUNsQyxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFNTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMvQixJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7WUFDZCxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwQjthQUFNO1lBQ0wsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNsQztJQUNILENBQUM7O0FBN0JzQixpQkFBUSxHQUFHLEdBQUcsQ0FBQztBQVdyQixhQUFJLEdBQWlDLEVBQUUsQ0FBQztBQVozRCw0QkErQkM7QUFBQSxDQUFDO0FBRUYsTUFBYSxVQUFXLFNBQVEsMEJBQVc7SUFtQnpDLFlBQXNCLElBQVk7UUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2QsQ0FBQztJQWxCTSxNQUFNLENBQUMsS0FBSztRQUNqQixPQUFPLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUMzQixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5RSxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUlTLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYztRQUNsQyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3hFLENBQUM7SUFNTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDbkMsSUFBSSxLQUFLLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUM1QixPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN4QjthQUFNO1lBQ0wsT0FBTyxzQkFBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakM7SUFDSCxDQUFDOztBQTdCc0IsbUJBQVEsR0FBRyxHQUFHLENBQUM7QUFXckIsaUJBQU0sR0FBbUMsRUFBRSxDQUFDO0FBWi9ELGdDQStCQztBQUFBLENBQUMifQ==