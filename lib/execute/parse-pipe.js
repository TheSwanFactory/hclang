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
    next(statement = false) {
        if (this.length() === 0) {
            return this;
        }
        const term = this.asArray();
        const expr = new frames_1.FrameExpr(term);
        if (statement) {
            expr.is.statement = true;
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
            console.error("mismatched-brackets", parent.factory, factory);
        }
        this.finish(frames_1.Frame.nil);
        return parent;
    }
    finish(terminal) {
        this.next();
        const out = this.get(frames_1.Frame.kOUT);
        const value = this.makeFrame();
        const result = out.call(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBK0U7QUFDL0UsMkNBQXVDO0FBRXZDLE1BQWEsU0FBVSxTQUFRLG1CQUFVO0lBSXZDLFlBQVksR0FBVSxFQUFFLE9BQVk7UUFDbEMsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNsQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFDTSxJQUFJLENBQUMsWUFBcUIsS0FBSztRQUNwQyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixNQUFNLElBQUksR0FBRyxJQUFJLGtCQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLENBQUMsRUFBRSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7U0FDMUI7UUFDRCxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxJQUFJLENBQUMsT0FBWTtRQUN0QixNQUFNLEtBQUssR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0MsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU0sR0FBRyxDQUFDLE9BQVk7UUFDckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFjLENBQUM7UUFDckQsSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLE9BQU8sRUFBRTtZQUM5QixPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDL0Q7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2QixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sTUFBTSxDQUFDLFFBQWE7UUFDekIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1osTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQy9CLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRVMsU0FBUztRQUNqQixNQUFNLEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztDQUNGO0FBdERELDhCQXNEQyJ9