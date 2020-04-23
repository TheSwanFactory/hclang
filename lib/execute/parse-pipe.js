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
        this.Factory = factory;
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
    push(Factory) {
        const child = new ParsePipe(this, Factory);
        return child;
    }
    pop(Factory) {
        const parent = this.get(ParsePipe.kOUT);
        if (parent.Factory !== Factory) {
            const msg = ['open:', parent.Factory, ' close:', Factory];
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
        const group = new this.Factory(this.collector);
        this.collector = [];
        return group;
    }
}
exports.ParsePipe = ParsePipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2UtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL3BhcnNlLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBOEU7QUFDOUUsMkNBQStDO0FBRS9DLE1BQWEsU0FBVSxTQUFRLG1CQUFVO0lBSXZDLFlBQWEsR0FBVSxFQUFFLE9BQVk7UUFDbkMsTUFBTSxJQUFJLEdBQVksRUFBRSxDQUFBO1FBQ3hCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFBO1FBQzFCLElBQUksQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsb0JBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtRQUNqQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDdEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUVNLElBQUksQ0FBRSxZQUFxQixLQUFLO1FBQ3JDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsRUFBRTtZQUN2QixPQUFPLElBQUksQ0FBQTtTQUNaO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQzNCLE1BQU0sSUFBSSxHQUFHLElBQUksa0JBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQyxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtTQUN6QjtRQUNELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQTtRQUNaLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVNLElBQUksQ0FBRSxPQUFZO1FBQ3ZCLE1BQU0sS0FBSyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUMxQyxPQUFPLEtBQUssQ0FBQTtJQUNkLENBQUM7SUFFTSxHQUFHLENBQUUsT0FBWTtRQUN0QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQWMsQ0FBQTtRQUNwRCxJQUFJLE1BQU0sQ0FBQyxPQUFPLEtBQUssT0FBTyxFQUFFO1lBQzlCLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1NBRTFEO1FBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDdEIsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRU0sTUFBTSxDQUFFLFFBQWE7UUFDMUIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ1gsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBQzlCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDOUIsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUNsQixPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFUyxTQUFTO1FBQ2pCLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDOUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUE7UUFDbkIsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0NBQ0Y7QUF4REQsOEJBd0RDIn0=