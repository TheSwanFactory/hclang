"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    Terminal.end = function () { return new Terminal(finish); };
    ;
    Terminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    Terminal.prototype.toData = function () { return this.data; };
    return Terminal;
}(frames_1.Frame));
exports.Terminal = Terminal;
exports.terminals = {};
var finish = function (source, parameter) {
    return source.finish();
};
var next = function (source, parameter) {
    return source.next();
};
var push = function (source, parameter) {
    return source.push();
};
var pop = function (source, parameter) {
    return source.pop();
};
exports.terminals[frames_1.Frame.kEND] = Terminal.end();
exports.terminals["\n"] = new Terminal(next);
exports.terminals["("] = new Terminal(push);
exports.terminals[")"] = new Terminal(pop);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUEyRTtBQUszRTtJQUE4Qiw0QkFBSztJQUdqQyxrQkFBc0IsSUFBb0I7UUFBMUMsWUFDRSxrQkFBTSxhQUFJLENBQUMsU0FFWjtRQUhxQixVQUFJLEdBQUosSUFBSSxDQUFnQjtRQUV4QyxLQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzs7SUFDckIsQ0FBQztJQUxhLFlBQUcsR0FBakIsY0FBc0IsTUFBTSxDQUFDLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFPOUMsd0JBQUssR0FBWixVQUFhLFFBQWUsRUFBRSxTQUFnQjtRQUM1QyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVTLHlCQUFNLEdBQWhCLGNBQTBCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMvQyxlQUFDO0FBQUQsQ0FBQyxBQWJELENBQThCLGNBQUssR0FhbEM7QUFiWSw0QkFBUTtBQWVSLFFBQUEsU0FBUyxHQUFZLEVBQ2pDLENBQUM7QUFFRixJQUFNLE1BQU0sR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDN0QsTUFBTSxDQUFFLE1BQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdEMsQ0FBQyxDQUFDO0FBRUYsSUFBTSxJQUFJLEdBQW1CLFVBQUMsTUFBYSxFQUFFLFNBQWdCO0lBQzNELE1BQU0sQ0FBRSxNQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BDLENBQUMsQ0FBQztBQUVGLElBQU0sSUFBSSxHQUFtQixVQUFDLE1BQWEsRUFBRSxTQUFnQjtJQUMzRCxNQUFNLENBQUUsTUFBa0IsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNwQyxDQUFDLENBQUM7QUFFRixJQUFNLEdBQUcsR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDMUQsTUFBTSxDQUFFLE1BQWtCLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkMsQ0FBQyxDQUFDO0FBRUYsaUJBQVMsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZDLGlCQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckMsaUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDIn0=