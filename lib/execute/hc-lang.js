"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const _ = require("lodash");
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
const make_context = (env) => {
    const context = {};
    _.each(env, (value, key) => {
        if (key[0] !== "n") {
            context[key] = new frames_1.FrameString(value);
        }
    });
    if (context["DEBUG_ENV"]) {
        console.log(context);
    }
    return context;
};
class HCLang extends frames_1.FrameArray {
    constructor(env = {}) {
        super([], frames_1.NilContext);
        const context = make_context(env);
        const root = new frames_1.Frame(context);
        this.up = root;
        this.lexer = HCLang.make_pipe(this);
    }
    static make_pipe(dest) {
        const evaluator = new eval_pipe_1.EvalPipe(dest);
        const parser = new parse_pipe_1.ParsePipe(evaluator, frames_1.FrameExpr);
        const lexer = new lex_pipe_1.LexPipe(parser);
        return lexer;
    }
    evaluate(input) {
        const result = this.lexer.lex_string(input);
        if (!result) {
            return frames_1.Frame.nil;
        }
        return result;
    }
    exec_file(file) {
        const input = fs.readFileSync(file, "utf8");
        return this.evaluate(input);
    }
}
exports.HCLang = HCLang;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtbGFuZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2hjLWxhbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx5QkFBeUI7QUFDekIsNEJBQTRCO0FBQzVCLHNDQUEyRjtBQUMzRiwyQ0FBdUM7QUFDdkMseUNBQXFDO0FBQ3JDLDZDQUF5QztBQU16QyxNQUFNLFlBQVksR0FBRyxDQUFDLEdBQWdCLEVBQUUsRUFBRTtJQUN4QyxNQUFNLE9BQU8sR0FBWSxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFDekIsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdkM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1FBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDdEI7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDLENBQUM7QUFFRixNQUFhLE1BQU8sU0FBUSxtQkFBVTtJQVlwQyxZQUFZLE1BQW1CLEVBQUU7UUFDL0IsS0FBSyxDQUFDLEVBQUUsRUFBRSxtQkFBVSxDQUFDLENBQUM7UUFDdEIsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLE1BQU0sSUFBSSxHQUFHLElBQUksY0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFoQk0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFnQjtRQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLG9CQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxDQUFDLFNBQVMsRUFBRSxrQkFBUyxDQUFDLENBQUM7UUFDbkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxrQkFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQWFNLFFBQVEsQ0FBQyxLQUFhO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLGNBQUssQ0FBQyxHQUFHLENBQUM7U0FDbEI7UUFFRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sU0FBUyxDQUFDLElBQVk7UUFDM0IsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7Q0FDRjtBQWpDRCx3QkFpQ0MifQ==