"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const _ = require("lodash");
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
class HC extends frames_1.FrameArray {
    static make_context(env) {
        const context = {};
        _.each(env, (value, key) => {
            if (key[0] !== "n") {
                context[key] = new frames_1.FrameString(value);
            }
        });
        if (context["DEBUG_ENV"]) {
            console.log("** DEBUG_ENV");
            console.log(context);
        }
        return context;
    }
    static make_pipe(dest) {
        const evaluator = new eval_pipe_1.EvalPipe(dest);
        const parser = new parse_pipe_1.ParsePipe(evaluator, frames_1.FrameExpr);
        const lexer = new lex_pipe_1.LexPipe(parser);
        return lexer;
    }
    constructor(env = {}) {
        super([], frames_1.NilContext);
        const context = HC.make_context(env);
        const root = new frames_1.Frame(context);
        this.up = root;
        this.lexer = HC.make_pipe(this);
    }
    evaluate(input) {
        const result = this.lexer.lex_string(input);
        if (!result) {
            return frames_1.Frame.nil;
        }
        const value = result.call(this);
        return value;
    }
    exec_file(file) {
        const input = fs.readFileSync(file, "utf8");
        return this.evaluate(input);
    }
}
exports.HC = HC;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9oYy1jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlCQUF5QjtBQUN6Qiw0QkFBNEI7QUFDNUIsc0NBQTJGO0FBQzNGLDJDQUF1QztBQUV2Qyx5Q0FBcUM7QUFDckMsNkNBQXlDO0FBTXpDLE1BQWEsRUFBRyxTQUFRLG1CQUFVO0lBQ3pCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBZ0I7UUFDekMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ3pCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUM1QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3RCO1FBQ0QsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVNLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBZ0I7UUFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxTQUFTLEVBQUUsa0JBQVMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsQyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFLRCxZQUFZLE1BQW1CLEVBQUU7UUFDL0IsS0FBSyxDQUFDLEVBQUUsRUFBRSxtQkFBVSxDQUFDLENBQUM7UUFDdEIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLGNBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNmLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRU0sUUFBUSxDQUFDLEtBQWE7UUFDM0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sY0FBSyxDQUFDLEdBQUcsQ0FBQztTQUNsQjtRQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU0sU0FBUyxDQUFDLElBQVk7UUFDM0IsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDNUMsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7Q0FDRjtBQTlDRCxnQkE4Q0MifQ==