"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const lex_1 = require("./lex");
class LexBytes extends frames_1.Frame {
    constructor(count) {
        super();
        this.count = count;
        this.body = [];
        this.is.void = true;
    }
    call(argument, _parameter = frames_1.Frame.nil) {
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
        this.body = [];
        return out.call(output);
    }
    makeFrame() {
        const frame = new frames_1.FrameBytes(this.body);
        return new lex_1.Token(frame);
    }
}
exports.LexBytes = LexBytes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LWJ5dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LWJ5dGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0Esc0NBQStFO0FBQy9FLCtCQUE4QjtBQUU5QixNQUFhLFFBQVMsU0FBUSxjQUFLO0lBS2pDLFlBQTZCLEtBQWE7UUFDeEMsS0FBSyxFQUFFLENBQUM7UUFEbUIsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUV4QyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUN0QixDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxVQUFVLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDakQsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzlCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRVMsTUFBTSxDQUFDLFNBQWdCLEVBQUUsVUFBbUI7UUFDcEQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRVMsV0FBVztRQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFFZixPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUIsQ0FBQztJQUVTLFNBQVM7UUFDakIsTUFBTSxLQUFLLEdBQUcsSUFBSSxtQkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN4QyxPQUFPLElBQUksV0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7Q0FDRjtBQXRDRCw0QkFzQ0MifQ==