"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
class HCTest extends frames_1.Frame {
    constructor(out) {
        super(frames_1.NilContext);
        this.out = out;
        this.n = { total: 0, pass: 0, fail: 0 };
    }
    call(actual, parameter = frames_1.Frame.nil) {
        const source = this.get(hc_eval_1.HCEval.SOURCE);
        const expected = this.get(hc_eval_1.HCEval.EXPECT);
        if (source.is.missing || expected.is.missing) {
            return actual;
        }
        this.set(hc_eval_1.HCEval.SOURCE, frames_1.Frame.missing);
        this.set(hc_eval_1.HCEval.EXPECT, frames_1.Frame.missing);
        return this.out.call(actual, parameter);
    }
}
exports.HCTest = HCTest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBZ0Y7QUFDaEYsdUNBQW1DO0FBSW5DLE1BQWEsTUFBTyxTQUFRLGNBQUs7SUFJL0IsWUFBc0IsR0FBVTtRQUM5QixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUU5QixJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sSUFBSSxDQUFDLE1BQWEsRUFBRSxTQUFTLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDOUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV6QyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQzVDLE9BQU8sTUFBTSxDQUFDO1NBQ2Y7UUFFRCxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUFyQkQsd0JBcUJDIn0=