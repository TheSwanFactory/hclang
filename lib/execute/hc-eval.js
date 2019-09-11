"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const lex_1 = require("./lex");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtZXZhbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWV2YWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzQ0FBaUY7QUFDakYsMkNBQXVDO0FBQ3ZDLCtCQUE0QjtBQUM1Qix5Q0FBcUM7QUFDckMsNkNBQXlDO0FBTXpDLE1BQWEsTUFBTTtJQTJCakIsWUFBc0IsR0FBVTtRQUFWLFFBQUcsR0FBSCxHQUFHLENBQU87UUFDOUIsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBeEJNLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBZ0I7UUFDekMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQzVCLE1BQU0sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRTtZQUMzQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFVO1FBQ2hDLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNwQyxNQUFNLE1BQU0sR0FBRyxJQUFJLHNCQUFTLENBQUMsU0FBUyxFQUFFLG1CQUFVLENBQUMsQ0FBQztRQUNwRCxNQUFNLEtBQUssR0FBRyxJQUFJLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBUU0sSUFBSSxDQUFDLEtBQWE7UUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDdEUsSUFBSSxNQUFNLFlBQVksU0FBRyxFQUFFO1lBQ3pCLE1BQU0sR0FBRyxHQUFHLG9CQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEI7SUFDSCxDQUFDO0lBRVMsVUFBVSxDQUFDLEtBQWE7UUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3QixNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFcEMsUUFBUSxJQUFJLEVBQUU7WUFDWixLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDbkMsTUFBTTthQUNQO1lBQ0QsS0FBSyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ25DLE1BQU07YUFDUDtTQUNGO0lBQ0gsQ0FBQzs7QUF6REgsd0JBMkRDO0FBMUR3QixhQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2QsYUFBTSxHQUFHLElBQUksQ0FBQztBQUNkLGFBQU0sR0FBRyxJQUFJLENBQUMifQ==