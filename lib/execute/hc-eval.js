"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = __importStar(require("chalk"));
const prompt_sync = __importStar(require("prompt-sync"));
const prompt_history = __importStar(require("prompt-sync-history"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsNkNBQThCO0FBQzlCLHlEQUEwQztBQUMxQyxvRUFBcUQ7QUFDckQsc0NBQW1FO0FBQ25FLHdDQUFvQztBQUNwQywyQ0FBc0M7QUFDdEMsK0JBQTJCO0FBQzNCLHlDQUFvQztBQUNwQyw2Q0FBd0M7QUFFeEMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQ3pCLE9BQU8sRUFBRSxjQUFjLEVBQUU7Q0FDMUIsQ0FBQyxDQUFBO0FBTUYsTUFBYSxNQUFNO0lBaUNqQixZQUF1QixHQUFVO1FBQVYsUUFBRyxHQUFILEdBQUcsQ0FBTztRQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQ3RDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtJQUN0QixDQUFDO0lBaENNLE1BQU0sQ0FBQyxZQUFZLENBQUUsR0FBZ0I7UUFDMUMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFBO1FBQzNCLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDdEM7UUFDSCxDQUFDLENBQUMsQ0FBQTtRQUNGLElBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQ3JCO1FBQ0QsT0FBTyxPQUFPLENBQUE7SUFDaEIsQ0FBQztJQUVN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