"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var old_tokens_1 = require("./old_tokens");
var LexParse = (function (_super) {
    __extends(LexParse, _super);
    function LexParse(out) {
        var _this = this;
        old_tokens_1.tokens[LexParse.kOUT] = out;
        _this = _super.call(this, old_tokens_1.tokens) || this;
        return _this;
    }
    LexParse.prototype.lex_string = function (input) {
        var source = new frames_1.FrameString(input);
        return this.lex(source);
    };
    LexParse.prototype.lex = function (source) {
        return source.reduce(this);
    };
    return LexParse;
}(frames_1.Frame));
exports.LexParse = LexParse;
exports.framify = function (input, context) {
    if (context === void 0) { context = frames_1.Void; }
    var env = new frames_1.Frame(context);
    var codify = new frames_1.FrameLazy([]);
    var expr = pipe(input, codify);
    return expr.call(env);
};
var pipe = function (input, out) {
    var output = new frames_1.FrameArray([]);
    var lexer = new LexParse(output);
    var status = lexer.lex_string(input);
    if (status !== lexer) {
    }
    return out.call(output);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGlwZWxpbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc3ludGF4L3BpcGVsaW5lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUFrRztBQUNsRywyQ0FBc0M7QUFFdEM7SUFBOEIsNEJBQUs7SUFDakMsa0JBQVksR0FBVTtRQUF0QixpQkFHQztRQUZDLG1CQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUM1QixRQUFBLGtCQUFNLG1CQUFNLENBQUMsU0FBQzs7SUFDaEIsQ0FBQztJQUVNLDZCQUFVLEdBQWpCLFVBQWtCLEtBQWE7UUFDN0IsSUFBTSxNQUFNLEdBQUcsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxzQkFBRyxHQUFWLFVBQVcsTUFBbUI7UUFDNUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUNILGVBQUM7QUFBRCxDQUFDLEFBZEQsQ0FBOEIsY0FBSyxHQWNsQztBQWRZLDRCQUFRO0FBZ0JSLFFBQUEsT0FBTyxHQUFHLFVBQUMsS0FBYSxFQUFFLE9BQWM7SUFBZCx3QkFBQSxFQUFBLHVCQUFjO0lBQ25ELElBQU0sR0FBRyxHQUFHLElBQUksY0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLElBQU0sTUFBTSxHQUFHLElBQUksa0JBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNqQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLENBQUMsQ0FBQztBQUVGLElBQU0sSUFBSSxHQUFHLFVBQUMsS0FBYSxFQUFFLEdBQVU7SUFDckMsSUFBTSxNQUFNLEdBQUcsSUFBSSxtQkFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2xDLElBQU0sS0FBSyxHQUFHLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBRW5DLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFdkIsQ0FBQztJQUNELE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFCLENBQUMsQ0FBQyJ9