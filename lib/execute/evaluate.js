"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const eval_pipe_1 = require("./eval-pipe");
const group_pipe_1 = require("./group-pipe");
const lex_pipe_1 = require("./lex-pipe");
const parse_pipe_1 = require("./parse-pipe");
exports.evaluate = (input, context = frames_1.NilContext) => {
    const result = new frames_1.FrameArray([], context);
    const evaluator = new eval_pipe_1.EvalPipe(result);
    const grouper = new group_pipe_1.GroupPipe(evaluator);
    const parser = new parse_pipe_1.ParsePipe(grouper);
    const lexer = new lex_pipe_1.LexPipe(parser);
    const status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNDQUF3RztBQUN4RywyQ0FBdUM7QUFDdkMsNkNBQXlDO0FBQ3pDLHlDQUFxQztBQUNyQyw2Q0FBeUM7QUFFNUIsUUFBQSxRQUFRLEdBQUcsQ0FBQyxLQUFhLEVBQUUsT0FBTyxHQUFHLG1CQUFVLEVBQVMsRUFBRTtJQUNyRSxNQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRTNDLE1BQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxNQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekMsTUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsQyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtLQUVyQjtJQUNELE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyJ9