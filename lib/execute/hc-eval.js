"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
const prompt_sync = require("prompt-sync");
const prompt_history = require("prompt-sync-history");
const frames_1 = require("../frames");
const version_1 = require("../version");
const eval_pipe_1 = require("./eval-pipe");
const lex_1 = require("./lex");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
const prompt = prompt_sync({
    history: prompt_history()
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
            if (key[0] !== 'n') {
                context[key] = new frames_1.FrameString(value);
            }
        });
        if (context.DEBUG_ENV) {
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
        const middle = ' '.repeat(indent);
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
        console.log(chalk.green('.hc ' + version_1.version + ';'));
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
        return prompt(chalk.grey(prefix));
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
HCEval.SOURCE = '; ';
HCEval.EXPECT = '# ';
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwrQkFBOEI7QUFDOUIsMkNBQTBDO0FBQzFDLHNEQUFxRDtBQUNyRCxzQ0FBbUU7QUFDbkUsd0NBQW9DO0FBQ3BDLDJDQUFzQztBQUN0QywrQkFBMkI7QUFDM0IseUNBQW9DO0FBQ3BDLDZDQUF3QztBQUV4QyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDekIsT0FBTyxFQUFFLGNBQWMsRUFBRTtDQUMxQixDQUFDLENBQUE7QUFNRixNQUFhLE1BQU07SUFpQ2pCLFlBQXVCLEdBQVU7UUFBVixRQUFHLEdBQUgsR0FBRyxDQUFPO1FBQy9CLElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7UUFDdEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO0lBQ3RCLENBQUM7SUFoQ00sTUFBTSxDQUFDLFlBQVksQ0FBRSxHQUFnQjtRQUMxQyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUE7UUFDM0IsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFO1lBQzNDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQTthQUN0QztRQUNILENBQUMsQ0FBQyxDQUFBO1FBQ0YsSUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ3JCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUE7U0FDckI7UUFDRCxPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0lBRU0sTUFBTSxD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