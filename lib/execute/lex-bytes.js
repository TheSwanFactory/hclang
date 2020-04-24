"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const lex_1 = require("./lex");
class LexBytes extends frames_1.Frame {
    constructor(count, up) {
        super();
        this.count = count;
        this.body = [];
        this.is.void = true;
        this.up = up;
    }
    call(argument, _parameter = frames_1.Frame.nil) {
        if (argument === frames_1.FrameSymbol.end()) {
            return this.finish(argument, false);
        }
        const char = argument.toString();
        const code = char.charCodeAt(0);
        this.body.push(code);
        if (this.body.length === this.count) {
            this.finish(argument, false);
        }
        return this;
    }
    finish(_argument, _passAlong) {
        this.exportFrame();
        return this.up;
    }
    exportFrame() {
        const output = this.makeFrame();
        const out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    }
    makeFrame() {
        if (this.body.length === 0) {
            return frames_1.FrameSymbol.end();
        }
        const frame = new frames_1.FrameBytes(this.body);
        this.body = [];
        return new lex_1.Token(frame);
    }
}
exports.LexBytes = LexBytes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LWJ5dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LWJ5dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esc0NBQW9FO0FBQ3BFLCtCQUE2QjtBQUU3QixNQUFhLFFBQVMsU0FBUSxjQUFLO0lBSWpDLFlBQThCLEtBQWEsRUFBRSxFQUFTO1FBQ3BELEtBQUssRUFBRSxDQUFBO1FBRHFCLFVBQUssR0FBTCxLQUFLLENBQVE7UUFFekMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUE7UUFDZCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7UUFDbkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUE7SUFDZCxDQUFDO0lBRU0sSUFBSSxDQUFFLFFBQWUsRUFBRSxVQUFVLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDbEQsSUFBSSxRQUFRLEtBQUssb0JBQVcsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNsQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFBO1NBQ3BDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDL0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDcEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFBO1NBQzdCO1FBQ0QsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRVMsTUFBTSxDQUFFLFNBQWdCLEVBQUUsVUFBbUI7UUFDckQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQTtJQUNoQixDQUFDO0lBRVMsV0FBVztRQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ3pCLENBQUM7SUFFUyxTQUFTO1FBQ2pCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzFCLE9BQU8sb0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtTQUN6QjtRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksbUJBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDdkMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUE7UUFDZCxPQUFPLElBQUksV0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO0lBQ3pCLENBQUM7Q0FDRjtBQTNDRCw0QkEyQ0MifQ==