"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const _ = require("lodash");
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const group_pipe_1 = require("./group-pipe");
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
        const grouper = new group_pipe_1.GroupPipe(evaluator);
        const parser = new parse_pipe_1.ParsePipe(grouper);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGMtY2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9oYy1jbGFzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHlCQUF5QjtBQUN6Qiw0QkFBNEI7QUFDNUIsc0NBQWdGO0FBQ2hGLDJDQUF1QztBQUN2Qyw2Q0FBeUM7QUFDekMseUNBQXFDO0FBQ3JDLDZDQUF5QztBQU16QyxNQUFhLEVBQUcsU0FBUSxtQkFBVTtJQUN6QixNQUFNLENBQUMsWUFBWSxDQUFDLEdBQWdCO1FBQ3pDLE1BQU0sT0FBTyxHQUFZLEVBQUUsQ0FBQztRQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN6QixJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7Z0JBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDdkM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDdEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU0sTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFnQjtRQUN0QyxNQUFNLFNBQVMsR0FBRyxJQUFJLG9CQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsTUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxNQUFNLEtBQUssR0FBRyxJQUFJLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEMsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBS0QsWUFBWSxNQUFtQixFQUFFO1FBQy9CLEtBQUssQ0FBQyxFQUFFLEVBQUUsbUJBQVUsQ0FBQyxDQUFDO1FBQ3RCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBSSxjQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDZixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVNLFFBQVEsQ0FBQyxLQUFhO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLGNBQUssQ0FBQyxHQUFHLENBQUM7U0FDbEI7UUFDRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLFNBQVMsQ0FBQyxJQUFZO1FBQzNCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixDQUFDO0NBQ0Y7QUE5Q0QsZ0JBOENDIn0=