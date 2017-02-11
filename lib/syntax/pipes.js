"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var lex_pipe_1 = require("./lex-pipe");
var EvalPipe = (function (_super) {
    __extends(EvalPipe, _super);
    function EvalPipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[EvalPipe.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return EvalPipe;
}(frames_1.Frame));
exports.EvalPipe = EvalPipe;
var ParsePipe = (function (_super) {
    __extends(ParsePipe, _super);
    function ParsePipe(out, meta) {
        if (meta === void 0) { meta = frames_1.Void; }
        var _this = this;
        meta[ParsePipe.kOUT] = out;
        _this = _super.call(this, meta) || this;
        return _this;
    }
    return ParsePipe;
}(frames_1.Frame));
exports.ParsePipe = ParsePipe;
var piper = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var result = new frames_1.FrameArray([], context);
    var evaluator = new EvalPipe(result);
    var parser = new ParsePipe(evaluator);
    var lexer = new lex_pipe_1.LexPipe(parser);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return result;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BpcGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFrRztBQUNsRyx1Q0FBcUM7QUFFckM7SUFBOEIsNEJBQUs7SUFDakMsa0JBQVksR0FBVSxFQUFFLElBQW9CO1FBQXBCLHFCQUFBLEVBQUEsb0JBQW9CO1FBQTVDLGlCQUdDO1FBRkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDMUIsUUFBQSxrQkFBTSxJQUFJLENBQUMsU0FBQzs7SUFDZCxDQUFDO0lBQ0gsZUFBQztBQUFELENBQUMsQUFMRCxDQUE4QixjQUFLLEdBS2xDO0FBTFksNEJBQVE7QUFPckI7SUFBK0IsNkJBQUs7SUFDbEMsbUJBQVksR0FBVSxFQUFFLElBQW9CO1FBQXBCLHFCQUFBLEVBQUEsb0JBQW9CO1FBQTVDLGlCQUdDO1FBRkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDM0IsUUFBQSxrQkFBTSxJQUFJLENBQUMsU0FBQzs7SUFDZCxDQUFDO0lBQ0gsZ0JBQUM7QUFBRCxDQUFDLEFBTEQsQ0FBK0IsY0FBSyxHQUtuQztBQUxZLDhCQUFTO0FBT3RCLElBQU0sS0FBSyxHQUFHLFVBQUMsS0FBYSxFQUFFLE9BQWM7SUFBZCx3QkFBQSxFQUFBLHVCQUFjO0lBQzFDLElBQU0sTUFBTSxHQUFHLElBQUksbUJBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDM0MsSUFBTSxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdkMsSUFBTSxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDeEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxrQkFBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRWxDLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFdkIsQ0FBQztJQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDaEIsQ0FBQyxDQUFDIn0=