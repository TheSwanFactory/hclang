"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
class HCEval {
    constructor(out) {
        this.out = out;
        this.current = HCEval.make_pipe(this.out);
    }
    static make_context(env) {
        const context = {};
        Object.entries(env).forEach(([key, value]) => {
            if (key[0] !== "n") {
                context[key] = new frames_1.FrameString(value);
            }
        });
        if (context["DEBUG_ENV"]) {
            console.log(context);
        }
        return context;
    }
    static make_pipe(out) {
        const evaluator = new eval_pipe_1.EvalPipe(out);
        const parser = new parse_pipe_1.ParsePipe(evaluator, frames_1.FrameGroup);
        const lexer = new lex_pipe_1.LexPipe(parser);
        return lexer;
    }
    call(input) {
        const line = input + "\n";
        const source = new frames_1.FrameString(line);
        this.current = source.reduce(this.current);
        this.setSource(input);
    }
    setSource(input) {
        const head = input.substr(0, 2);
        const tail = input.substr(2);
        if (head === HCEval.SOURCE) {
            const source = new frames_1.FrameString(tail);
            this.out.set(HCEval.SOURCE, source);
        }
    }
}
exports.HCEval = HCEval;
HCEval.SOURCE = "; ";
HCEval.EXPECT = "# ";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBb0U7QUFDcEUsMkNBQXVDO0FBQ3ZDLHlDQUFxQztBQUNyQyw2Q0FBeUM7QUFNekMsTUFBYSxNQUFNO0lBMEJqQixZQUFzQixHQUFVO1FBQVYsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUM5QixJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUF4Qk0sTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFnQjtRQUN6QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQzNDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN0QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQVU7UUFDaEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxTQUFTLEVBQUUsbUJBQVUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFRTSxJQUFJLENBQUMsS0FBYTtRQUN2QixNQUFNLElBQUksR0FBRyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQzFCLE1BQU0sTUFBTSxHQUFHLElBQUksb0JBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVTLFNBQVMsQ0FBQyxLQUFhO1FBQy9CLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDN0IsSUFBSSxJQUFJLEtBQUssTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUMxQixNQUFNLE1BQU0sR0FBRyxJQUFJLG9CQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNyQztJQUNILENBQUM7O0FBNUNILHdCQThDQztBQTdDd0IsYUFBTSxHQUFHLElBQUksQ0FBQztBQUNkLGFBQU0sR0FBRyxJQUFJLENBQUMifQ==