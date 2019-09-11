"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const hc_eval_1 = require("./hc-eval");
class HCTest extends frames_1.Frame {
    constructor(out) {
        super(frames_1.NilContext);
        this.out = out;
        this.actual = frames_1.Frame.missing;
        this.n = { total: 0, pass: 0, fail: 0 };
    }
    apply(argument, parameter = frames_1.Frame.nil) {
        const source = this.get(hc_eval_1.HCEval.SOURCE);
        const expected = this.get(hc_eval_1.HCEval.EXPECT);
        if (this.actual !== frames_1.Frame.missing || expected !== frames_1.Frame.missing) {
            const result = this.performTest(expected, this.actual, source);
            return this.out.call(result, parameter);
        }
        if (source !== frames_1.Frame.missing) {
            this.actual = argument;
        }
        return argument;
    }
    performTest(expected, actual, source) {
        const result = this.assertEqual(expected.toString(), actual.toString(), source.toString());
        console.error("assertEqual.result", result.toString());
        this.set(hc_eval_1.HCEval.SOURCE, frames_1.Frame.missing);
        this.set(hc_eval_1.HCEval.EXPECT, frames_1.Frame.missing);
        this.actual = frames_1.Frame.missing;
        return result;
    }
    assertEqual(expected, actual, source) {
        console.error("assertEqual", "expected", expected, "actual", actual, "source", source);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtdGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLXRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBeUQ7QUFDekQsdUNBQW1DO0FBSW5DLE1BQWEsTUFBTyxTQUFRLGNBQUs7SUFLL0IsWUFBc0IsR0FBVTtRQUM5QixLQUFLLENBQUMsbUJBQVUsQ0FBQyxDQUFDO1FBREUsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUU5QixJQUFJLENBQUMsTUFBTSxHQUFHLGNBQUssQ0FBQyxPQUFPLENBQUM7UUFDNUIsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBUyxHQUFHLGNBQUssQ0FBQyxHQUFHO1FBQ2pELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLGNBQUssQ0FBQyxPQUFPLElBQUksUUFBUSxLQUFLLGNBQUssQ0FBQyxPQUFPLEVBQUU7WUFDL0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUM5RCxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksTUFBTSxLQUFLLGNBQUssQ0FBQyxPQUFPLEVBQUU7WUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7U0FDeEI7UUFDRCxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRU0sV0FBVyxDQUFDLFFBQWUsRUFBRSxNQUFhLEVBQUUsTUFBYTtRQUM5RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDM0YsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFNLENBQUMsTUFBTSxFQUFFLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsTUFBTSxHQUFHLGNBQUssQ0FBQyxPQUFPLENBQUM7UUFDNUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLFdBQVcsQ0FBQyxRQUFnQixFQUFFLE1BQWMsRUFBRSxNQUFjO1FBQ2pFLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdkYsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLElBQUksR0FBRyxRQUFRLENBQUM7UUFFdEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1FBQ2xCLElBQUksUUFBUSxLQUFLLE1BQU0sRUFBRTtZQUN2QixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUM7WUFDakIsT0FBTyxrQkFBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3QjthQUFNO1lBQ0wsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDO1lBQ2pCLE9BQU8sa0JBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQztTQUM3QztJQUNILENBQUM7Q0FFRjtBQWpERCx3QkFpREMifQ==