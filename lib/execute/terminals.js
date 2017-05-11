"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var frames_1 = require("../frames");
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(data) {
        var _this = _super.call(this, frames_1.NilContext) || this;
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
    return source.finish(parameter);
};
var perform = function (actions) {
    return function (source, parameter) {
        return source.perform(actions);
    };
};
exports.terminals[frames_1.Frame.kEND] = Terminal.end();
exports.terminals["\n"] = new Terminal(perform({ next: frames_1.Frame.nil }));
exports.terminals["("] = new Terminal(perform({ push: frames_1.Frame.nil }));
exports.terminals[")"] = new Terminal(perform({ pop: frames_1.Frame.nil }));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFpRjtBQUtqRjtJQUE4Qiw0QkFBSztJQUdqQyxrQkFBc0IsSUFBb0I7UUFBMUMsWUFDRSxrQkFBTSxtQkFBVSxDQUFDLFNBRWxCO1FBSHFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBRXhDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBTGEsWUFBRyxHQUFqQixjQUFzQixNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQU85Qyx3QkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMseUJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLGVBQUM7QUFBRCxDQUFDLEFBYkQsQ0FBOEIsY0FBSyxHQWFsQztBQWJZLDRCQUFRO0FBZVIsUUFBQSxTQUFTLEdBQVksRUFDakMsQ0FBQztBQUVGLElBQU0sTUFBTSxHQUFtQixVQUFDLE1BQWEsRUFBRSxTQUFnQjtJQUM3RCxNQUFNLENBQUUsTUFBa0IsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDL0MsQ0FBQyxDQUFDO0FBRUYsSUFBTSxPQUFPLEdBQUcsVUFBQyxPQUFnQjtJQUMvQixNQUFNLENBQUMsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7UUFDckMsTUFBTSxDQUFFLE1BQWtCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLGlCQUFTLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN2QyxpQkFBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxjQUFLLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsSUFBSSxFQUFFLGNBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsaUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUUsY0FBSyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQyJ9