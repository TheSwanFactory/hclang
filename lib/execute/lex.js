"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var Lex = (function (_super) {
    __extends(Lex, _super);
    function Lex() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.body = "";
        _this.pass_on = false;
        return _this;
    }
    Lex.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frames_1.Frame.nil; }
        if (this.isEnd(argument.toString())) {
            this.exportFrame();
            this.body = "";
            if (this.pass_on) {
                var result = this.up.call(argument);
                return result;
            }
            return this.up;
        }
        this.body = this.body + argument.toString();
        return this;
    };
    Lex.prototype.getClassName = function () {
        var funcNameRegex = /function (.{1,})\(/;
        var results = (funcNameRegex).exec(this.constructor.toString());
        return (results && results.length > 1) ? results[1] : "<class>";
    };
    Lex.prototype.toString = function () {
        return this.getClassName() + ("[" + this.body + "]");
    };
    Lex.prototype.isEnd = function (char) {
        return false;
    };
    Lex.prototype.exportFrame = function () {
        var output = this.makeFrame();
        var out = this.get(frames_1.Frame.kOUT);
        return out.call(output);
    };
    Lex.prototype.makeFrame = function () {
        return frames_1.Frame.nil;
    };
    return Lex;
}(frames_1.Frame));
exports.Lex = Lex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLG9DQUFrQztBQUVsQztJQUF5Qix1QkFBSztJQUE5QjtRQUFBLHFFQTRDQztRQTFDVyxVQUFJLEdBQVcsRUFBRSxDQUFDO1FBQ2xCLGFBQU8sR0FBRyxLQUFLLENBQUM7O0lBeUM1QixDQUFDO0lBdkNRLGtCQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLGNBQUssQ0FBQyxHQUFHO1FBQ2hELEVBQUUsQ0FBQyxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXRDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNmLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNqQixJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDdEMsTUFBTSxDQUFDLE1BQU0sQ0FBQztZQUNoQixDQUFDO1lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSwwQkFBWSxHQUFuQjtRQUNFLElBQU0sYUFBYSxHQUFHLG9CQUFvQixDQUFDO1FBQzNDLElBQU0sT0FBTyxHQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNuRSxNQUFNLENBQUMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ2xFLENBQUM7SUFFTSxzQkFBUSxHQUFmO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBRyxNQUFJLElBQUksQ0FBQyxJQUFJLE1BQUcsQ0FBQSxDQUFDO0lBQ2hELENBQUM7SUFFUyxtQkFBSyxHQUFmLFVBQWdCLElBQVk7UUFDMUIsTUFBTSxDQUFDLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFUyx5QkFBVyxHQUFyQjtRQUNFLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNoQyxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGNBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRVMsdUJBQVMsR0FBbkI7UUFDRSxNQUFNLENBQUMsY0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBQ0gsVUFBQztBQUFELENBQUMsQUE1Q0QsQ0FBeUIsY0FBSyxHQTRDN0I7QUE1Q1ksa0JBQUcifQ==