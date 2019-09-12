"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const frames_1 = require("../frames");
const version_1 = require("../version");
const eval_pipe_1 = require("./eval-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
const prompt = prompt_sync({
    history: prompt_history(),
});
class HCEval {
    constructor(out) {
        this.out = out;
        this.lexer = HCEval.make_pipe(this.out);
        this.current = this.lexer;
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
        if (!input) {
            return null;
        }
        console.error("HCEval.input", input);
        const source = new frames_1.FrameString(input);
        this.checkInput(input);
        const result = source.reduce(this.current);
        console.error("HCEval.result", result.id);
        this.current = result;
        return result;
    }
    repl() {
        console.log(".hc " + version_1.version);
        let status = true;
        while (status) {
            const input = prompt(HCEval.SOURCE);
            if (!input) {
                status = false;
                break;
            }
            const output = this.call(input);
            const debug = this.out.get("DEBUG");
            if (debug !== frames_1.Frame.missing) {
                console.log(output);
            }
            if (output !== frames_1.Frame.nil) {
                console.log(HCEval.EXPECT + output);
            }
        }
        return status;
    }
    checkInput(input) {
        const head = input.substr(0, 2);
        const tail = input.substr(2);
        const value = new frames_1.FrameString(tail);
        switch (head) {
            case HCEval.SOURCE: {
                this.out.set(HCEval.SOURCE, value);
                break;
            }
            case HCEval.EXPECT: {
                this.out.set(HCEval.EXPECT, value);
                break;
            }
        }
    }
}
exports.HCEval = HCEval;
HCEval.SOURCE = "; ";
HCEval.EXPECT = "# ";
HCEval.ACTUAL = "# ";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBMkM7QUFDM0Msc0RBQXNEO0FBQ3RELHNDQUFpRjtBQUNqRix3Q0FBcUM7QUFDckMsMkNBQXVDO0FBRXZDLHlDQUFxQztBQUNyQyw2Q0FBeUM7QUFFekMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQ3pCLE9BQU8sRUFBRSxjQUFjLEVBQUU7Q0FDMUIsQ0FBQyxDQUFDO0FBTUgsTUFBYSxNQUFNO0lBNEJqQixZQUFzQixHQUFVO1FBQVYsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUM1QixDQUFDO0lBMUJNLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBZ0I7UUFDekMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFVO1FB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