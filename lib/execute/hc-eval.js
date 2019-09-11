"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const frames_1 = require("../frames");
const version_1 = require("../version");
const eval_pipe_1 = require("./eval-pipe");
const lex_1 = require("./lex");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
const prompt = prompt_sync({
    history: prompt_history(),
});
class HCEval {
    constructor(out) {
        this.out = out;
        this.lexer = HCEval.make_pipe(this.out);
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
        const source = new frames_1.FrameString(input);
        this.checkInput(input);
        const result = source.reduce(this.lexer);
        console.error("input", input, result.toString(), this.out.toString());
        if (result instanceof lex_1.Lex) {
            const end = frames_1.FrameSymbol.for("\n");
            result.call(end);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBMkM7QUFDM0Msc0RBQXNEO0FBQ3RELHNDQUFpRjtBQUNqRix3Q0FBcUM7QUFDckMsMkNBQXVDO0FBQ3ZDLCtCQUE0QjtBQUM1Qix5Q0FBcUM7QUFDckMsNkNBQXlDO0FBRXpDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQztJQUN6QixPQUFPLEVBQUUsY0FBYyxFQUFFO0NBQzFCLENBQUMsQ0FBQztBQU1ILE1BQWEsTUFBTTtJQTJCakIsWUFBc0IsR0FBVTtRQUFWLFFBQUcsR0FBSCxHQUFHLENBQU87UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBeEJNLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBZ0I7UUFDekMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFVO1FBQ2hDLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FB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