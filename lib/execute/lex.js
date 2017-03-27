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
        var char = argument.toString();
        if (this.isEnd(char)) {
            return this.finish(argument);
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
    Lex.prototype.finish = function (argument) {
        this.exportFrame();
        this.body = "";
        if (this.pass_on) {
            var result = this.up.call(argument);
            return result;
        }
        return this.up;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGV4LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvbGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLG9DQUFrQztBQUVsQztJQUF5Qix1QkFBSztJQUE5QjtRQUFBLHFFQWdEQztRQTlDVyxVQUFJLEdBQVcsRUFBRSxDQUFDO1FBQ2xCLGFBQU8sR0FBRyxLQUFLLENBQUM7O0lBNkM1QixDQUFDO0lBM0NRLGtCQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLGNBQUssQ0FBQyxHQUFHO1FBQ2hELElBQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNqQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLDBCQUFZLEdBQW5CO1FBQ0UsSUFBTSxhQUFhLEdBQUcsb0JBQW9CLENBQUM7UUFDM0MsSUFBTSxPQUFPLEdBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLE1BQU0sQ0FBQyxDQUFDLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUM7SUFDbEUsQ0FBQztJQUVNLHNCQUFRLEdBQWY7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFHLE1BQUksSUFBSSxDQUFDLElBQUksTUFBRyxDQUFBLENBQUM7SUFDaEQsQ0FBQztJQUVTLG1CQUFLLEdBQWYsVUFBZ0IsSUFBWTtRQUMxQixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVTLG9CQUFNLEdBQWhCLFVBQWlCLFFBQWU7UUFDOUIsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2YsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDakIsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUNoQixDQUFDO1FBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVTLHlCQUFXLEdBQXJCO1FBQ0UsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ2hDLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWpDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFUyx1QkFBUyxHQUFuQjtRQUNFLE1BQU0sQ0FBQyxjQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFDSCxVQUFDO0FBQUQsQ0FBQyxBQWhERCxDQUF5QixjQUFLLEdBZ0Q3QjtBQWhEWSxrQkFBRyJ9