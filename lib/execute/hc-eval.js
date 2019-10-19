"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
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
        this.pipe = HCEval.make_pipe(this.out);
        this.lex = this.pipe;
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
    static make_prompt(level) {
        const indent = 2 * (level - 1);
        const middle = " ".repeat(indent);
        return HCEval.EXPECT + middle + HCEval.EXPECT;
    }
    call(input) {
        if (!input) {
            return null;
        }
        const source = new frames_1.FrameString(input);
        this.checkInput(input);
        const result = source.reduce(this.lex);
        this.lex = (result instanceof lex_1.Lex) ? result : this.pipe;
        return result;
    }
    repl() {
        console.log(chalk_1.default.green(".hc " + version_1.version + ";"));
        let status = true;
        while (status) {
            const input = this.getInput();
            if (!input) {
                status = false;
                break;
            }
            this.call(input);
        }
        return status;
    }
    getInput() {
        let prefix = HCEval.SOURCE;
        if (this.pipe.level > 0) {
            prefix = HCEval.make_prompt(this.pipe.level);
        }
        return prompt(chalk_1.default.grey(prefix));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBMEI7QUFDMUIsMkNBQTJDO0FBQzNDLHNEQUFzRDtBQUN0RCxzQ0FBaUY7QUFDakYsd0NBQXFDO0FBQ3JDLDJDQUF1QztBQUN2QywrQkFBNEI7QUFDNUIseUNBQXFDO0FBQ3JDLDZDQUF5QztBQUV6QyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDekIsT0FBTyxFQUFFLGNBQWMsRUFBRTtDQUMxQixDQUFDLENBQUM7QUFNSCxNQUFhLE1BQU07SUFpQ2pCLFlBQXNCLEdBQVU7UUFBVixRQUFHLEdBQUgsR0FBRyxDQUFPO1FBQzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFoQ00sTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFnQjtRQUN6QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7UUFDNUIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQzNDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN0QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxN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