"use strict";
var frames_1 = require("../frames");
var eval_pipe_1 = require("./eval-pipe");
var group_pipe_1 = require("./group-pipe");
var lex_pipe_1 = require("./lex-pipe");
var parse_pipe_1 = require("./parse-pipe");
exports.evaluate = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsb0NBQWtHO0FBQ2xHLHlDQUF1QztBQUN2QywyQ0FBeUM7QUFDekMsdUNBQXFDO0FBQ3JDLDJDQUF5QztBQUU1QixRQUFBLFFBQVEsR0FBRyxVQUFDLEtBQWEsRUFBRSxPQUFjO0lBQWQsd0JBQUEsRUFBQSx1QkFBYztJQUNwRCxJQUFNLE1BQU0sR0FBRyxJQUFJLG1CQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzNDLElBQU0sU0FBUyxHQUFHLElBQUksb0JBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN2QyxJQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDekMsSUFBTSxNQUFNLEdBQUcsSUFBSSxzQkFBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLElBQU0sS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsQyxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRXZCLENBQUM7SUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyJ9