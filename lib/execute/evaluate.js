"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frames_1 = require("../frames");
var eval_pipe_1 = require("./eval-pipe");
var group_pipe_1 = require("./group-pipe");
var lex_pipe_1 = require("./lex-pipe");
var parse_pipe_1 = require("./parse-pipe");
exports.evaluate = function (input, context) {
    if (context === void 0) { context = frames_1.NilContext; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new eval_pipe_1.EvalPipe(result);
    var grouper = new group_pipe_1.GroupPipe(evaluator);
    var parser = new parse_pipe_1.ParsePipe(grouper);
    var lexer = new lex_pipe_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9DQUF3RztBQUN4Ryx5Q0FBdUM7QUFDdkMsMkNBQXlDO0FBQ3pDLHVDQUFxQztBQUNyQywyQ0FBeUM7QUFFNUIsUUFBQSxRQUFRLEdBQUcsVUFBQyxLQUFhLEVBQUUsT0FBb0I7SUFBcEIsd0JBQUEsRUFBQSw2QkFBb0I7SUFDMUQsSUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUUzQyxJQUFNLFNBQVMsR0FBRyxJQUFJLG9CQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBTSxPQUFPLEdBQUcsSUFBSSxzQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLElBQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxJQUFNLEtBQUssR0FBRyxJQUFJLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbEMsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztJQUV2QixDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUMifQ==