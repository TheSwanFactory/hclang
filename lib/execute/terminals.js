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
var terminate = function (source, parameter) {
    return source.finish(parameter);
};
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(data) {
        var _this = _super.call(this, frames_1.NilContext) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    Terminal.end = function () { return new Terminal(terminate); };
    ;
    Terminal.prototype.apply = function (argument, parameter) {
        return this.data(argument, parameter);
    };
    Terminal.prototype.toData = function () { return this.data; };
    return Terminal;
}(frames_1.Frame));
exports.Terminal = Terminal;
exports.terminals = {};
var perform = function (actions) {
    return function (source, parameter) {
        return source.perform(actions);
    };
};
exports.terminals[frames_1.Frame.kEND] = Terminal.end();
exports.terminals["\n"] = new Terminal(perform({ next: frames_1.Frame.nil }));
exports.terminals["("] = new Terminal(perform({ push: frames_1.Frame.nil }));
exports.terminals[")"] = new Terminal(perform({ pop: frames_1.Frame.nil }));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLG9DQUFpRjtBQVNqRixJQUFNLFNBQVMsR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDaEUsTUFBTSxDQUFFLE1BQWtCLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQy9DLENBQUMsQ0FBQztBQUVGO0lBQThCLDRCQUFLO0lBR2pDLGtCQUFzQixJQUFvQjtRQUExQyxZQUNFLGtCQUFNLG1CQUFVLENBQUMsU0FFbEI7UUFIcUIsVUFBSSxHQUFKLElBQUksQ0FBZ0I7UUFFeEMsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7O0lBQ3JCLENBQUM7SUFMYSxZQUFHLEdBQWpCLGNBQXNCLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBT2pELHdCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFUyx5QkFBTSxHQUFoQixjQUEwQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0MsZUFBQztBQUFELENBQUMsQUFiRCxDQUE4QixjQUFLLEdBYWxDO0FBYlksNEJBQVE7QUFlUixRQUFBLFNBQVMsR0FBWSxFQUNqQyxDQUFDO0FBRUYsSUFBTSxPQUFPLEdBQUcsVUFBQyxPQUFnQjtJQUMvQixNQUFNLENBQUMsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7UUFDckMsTUFBTSxDQUFFLE1BQXFCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQztBQUNKLENBQUMsQ0FBQztBQUVGLGlCQUFTLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN2QyxpQkFBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFDLElBQUksRUFBRSxjQUFLLENBQUMsR0FBRyxFQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUMsSUFBSSxFQUFFLGNBQUssQ0FBQyxHQUFHLEVBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUQsaUJBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBQyxHQUFHLEVBQUUsY0FBSyxDQUFDLEdBQUcsRUFBQyxDQUFDLENBQUMsQ0FBQyJ9