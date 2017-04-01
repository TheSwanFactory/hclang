"use strict";
var frames_1 = require("../frames");
var eval_pipe_1 = require("./eval-pipe");
var lex_pipe_1 = require("./lex-pipe");
var parse_pipe_1 = require("./parse-pipe");
exports.evaluate = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new eval_pipe_1.EvalPipe(result);
    var parser = new parse_pipe_1.ParsePipe(evaluator);
    var lexer = new lex_pipe_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZhbHVhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZXhlY3V0ZS9ldmFsdWF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsb0NBQWtHO0FBQ2xHLHlDQUF1QztBQUV2Qyx1Q0FBcUM7QUFDckMsMkNBQXlDO0FBRTVCLFFBQUEsUUFBUSxHQUFHLFVBQUMsS0FBYSxFQUFFLE9BQWM7SUFBZCx3QkFBQSxFQUFBLHVCQUFjO0lBQ3BELElBQU0sTUFBTSxHQUFHLElBQUksbUJBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsSUFBTSxTQUFTLEdBQUcsSUFBSSxvQkFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRXZDLElBQU0sTUFBTSxHQUFHLElBQUksc0JBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4QyxJQUFNLEtBQUssR0FBRyxJQUFJLGtCQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFbEMsSUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN2QyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztJQUV2QixDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUMifQ==