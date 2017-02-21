"use strict";
var frames_1 = require("../frames");
var eval_pipe_1 = require("./eval-pipe");
var lex_pipe_1 = require("./lex-pipe");
var parse_1 = require("./parse");
exports.piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new eval_pipe_1.EvalPipe(result);
    var parser = new parse_1.ParsePipe(evaluator);
    var lexer = new lex_pipe_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BpcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxvQ0FBa0c7QUFDbEcseUNBQXVDO0FBQ3ZDLHVDQUFxQztBQUNyQyxpQ0FBb0M7QUFFdkIsUUFBQSxLQUFLLEdBQUcsVUFBQyxLQUFhLEVBQUUsT0FBYztJQUFkLHdCQUFBLEVBQUEsdUJBQWM7SUFDakQsSUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUMzQyxJQUFNLFNBQVMsR0FBRyxJQUFJLG9CQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLElBQU0sS0FBSyxHQUFHLElBQUksa0JBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVsQyxJQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBRXZCLENBQUM7SUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyJ9