"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const terminals_1 = require("./terminals");
class ParsePipe extends frames_1.FrameArray {
    constructor(out, factory) {
        const meta = {};
        meta[ParsePipe.kOUT] = out;
        meta[frames_1.Frame.kEND] = terminals_1.Terminal.end();
        super([], meta);
        this.factory = factory;
        this.collector = [];
    }
    next(header = false) {
        if (this.length() === 0) {
            return this;
        }
        const term = this.asArray();
        const expr = new frames_1.FrameExpr(term);
        if (header) {
            expr.is.header = true;
        }
        this.collector.push(expr);
        this.reset();
        return this;
    }
    push(factory) {
        const child = new ParsePipe(this, factory);
        return child;
    }
    pop(factory) {
        const parent = this.get(ParsePipe.kOUT);
        if (parent.factory !== factory) {
        }
        return parent;
    }
    finish(terminal) {
        this.next();
        const out = this.get(frames_1.Frame.kOUT);
        const result = this.makeFrame();
        out.call(result);
        out.call(terminal);
        return result;
    }
    makeFrame() {
        const group = new this.factory(this.collector);
        this.collector = [];
        return group;
    }
}
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBK0U7QUFDL0UsMkNBQXVDO0FBRXZDLE1BQWEsU0FBVSxTQUFRLG1CQUFVO0lBS3ZDLFlBQVksR0FBVSxFQUFFLE9BQVk7UUFDbEMsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDTSxJQUFJLENBQUMsU0FBa0IsS0FBSztRQUNqQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLGtCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxNQUFNLEVBQUU7WUFDVixJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDdkI7UUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBWTtRQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0MsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU0sR0FBRyxDQUFDLE9BQVk7UUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFjLENBQUM7UUFDckQsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtTQUUvQjtRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxNQUFNLENBQUMsUUFBYTtRQUN6QixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQixHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25CLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFUyxTQUFTO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDcEIsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQ0Y7QUF0REQsOEJBc0RDIn0=