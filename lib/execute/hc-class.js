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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9oYy1jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlCQUF5QjtBQUN6Qiw0QkFBNEI7QUFDNUIsc0NBQTJGO0FBQzNGLDJDQUF1QztBQUV2Qyx5Q0FBcUM7QUFDckMsNkNBQXlDO0FBTXpDLE1BQWEsRUFBRyxTQUFRLG1CQUFVO0lBQ3pCLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBZ0I7UUFDekMsTUFBTSxPQUFPLEdBQVksRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQ3pCLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtnQkFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN2QztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN0QjtRQUNELE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFTSxNQUFNLENBQUMsU0FBUyxDQUFDLElBQWdCO1FBQ3RDLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxNQUFNLE1BQU0sR0FBRyxJQUFJLHNCQUFTLENBQUMsU0FBUyxFQUFFLGtCQUFTLENBQUMsQ0FBQztRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBS0QsWUFBWSxNQUFtQixFQUFFO1FBQy9CLEtBQUssQ0FBQyxFQUFFLEVBQUUsbUJBQVUsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBSSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFhO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLGNBQUssQ0FBQyxHQUFHLENBQUM7U0FDbEI7UUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLFNBQVMsQ0FBQyxJQUFZO1FBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUE3Q0QsZ0JBNkNDIn0=