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
    call(argument, parameter = frames_1.Frame.nil) {
        const source = this.get(hc_eval_1.HCEval.SOURCE);
        const expected = this.get(hc_eval_1.HCEval.EXPECT);
        if (source.is.missing || expected.is.missing) {
            return frames_1.Frame.nil;
        }
        const result = this.assertEqual(expected.toString(), argument.toString(), source.toString());
        this.set(hc_eval_1.HCEval.SOURCE, frames_1.Frame.missing);
        this.set(hc_eval_1.HCEval.EXPECT, frames_1.Frame.missing);
        return this.out.call(result, parameter);
    }
    assertEqual(expected, actual, source) {
        const base = source + " +" + expected;
        this.n.total += 1;
        if (expected === actual) {
            this.n.pass += 1;
            return frames_1.FrameNote.pass(base);
        }
        else {
            this.n.pass += 1;
            return frames_1.FrameNote.fail(base + " -" + actual);
        }
    }
}
exports.HCTest = HCTest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBeUQ7QUFDekQsdUNBQW1DO0FBSW5DLE1BQWEsTUFBTyxTQUFRLGNBQUs7SUFJL0IsWUFBc0IsR0FBVTtRQUM5QixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUU5QixJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsY0FBSyxDQUFDLEdBQUc7UUFDaEQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3ZDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV6QyxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFO1lBQzVDLE9BQU8sY0FBSyxDQUFDLEdBQUcsQ0FBQztTQUNsQjtRQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQzdCLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFDbkIsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUNuQixNQUFNLENBQUMsUUFBUSxFQUFFLENBQ2xCLENBQUM7UUFDRixJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRU0sV0FBVyxDQUFDLFFBQWdCLEVBQUUsTUFBYyxFQUFFLE1BQWM7UUFDakUsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLElBQUksR0FBRyxRQUFRLENBQUM7UUFFdEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ2xCLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDakIsT0FBTyxrQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3QjthQUFNO1lBQ0wsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2pCLE9BQU8sa0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQztTQUM3QztJQUNILENBQUM7Q0FFRjtBQXZDRCx3QkF1Q0MifQ==