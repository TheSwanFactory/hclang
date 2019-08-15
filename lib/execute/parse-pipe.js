"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const terminals_1 = require("./terminals");
class ParsePipe extends frames_1.FrameArray {
    constructor(out) {
        const meta = {};
        meta[ParsePipe.kOUT] = out;
        meta[frames_1.Frame.kEND] = terminals_1.Terminal.end();
        super([], meta);
        this.factory = frames_1.FrameExpr;
    }
    push(argument) {
        const child = new ParsePipe(this);
        return child;
    }
    pop(argument) {
        const parent = this.get(ParsePipe.kOUT);
        return parent;
    }
    finish(argument) {
        const terminal = frames_1.FrameSymbol.end();
        const result = this.makeFrame();
        const out = this.get(frames_1.Frame.kOUT);
        const output = out.call(result);
        const finished = out.call(terminal);
        this.reset();
        return result;
    }
    makeFrame() {
        const current = this.asArray();
        return new this.factory(current);
    }
}
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBc0c7QUFDdEcsMkNBQXVDO0FBRXZDLGVBQXVCLFNBQVEsbUJBQVU7SUFHdkMsWUFBWSxHQUFVO1FBQ3BCLE1BQU0sSUFBSSxHQUFZLEVBQUUsQ0FBQztRQUN6QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUMzQixJQUFJLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLG9CQUFRLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbEMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLGtCQUFTLENBQUM7SUFDM0IsQ0FBQztJQUVNLElBQUksQ0FBQyxRQUFlO1FBQ3pCLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sQ0FBQyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU0sR0FBRyxDQUFDLFFBQWU7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQWU7UUFDM0IsTUFBTSxRQUFRLEdBQUcsb0JBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNuQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoQyxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNiLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVTLFNBQVM7UUFDakIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbkMsQ0FBQztDQUNGO0FBbkNELDhCQW1DQyJ9