"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var finish = function (source, parameter) {
    return source.finish();
};
var next = function (source, parameter) {
    return source.next();
};
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
exports.terminals[frames_1.Frame.kEND] = Terminal.end();
exports.terminals["\n"] = new Terminal(next);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUEyRTtBQUszRSxJQUFNLE1BQU0sR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDN0QsTUFBTSxDQUFFLE1BQWtCLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDdEMsQ0FBQyxDQUFDO0FBRUYsSUFBTSxJQUFJLEdBQW1CLFVBQUMsTUFBYSxFQUFFLFNBQWdCO0lBQzNELE1BQU0sQ0FBRSxNQUFrQixDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3BDLENBQUMsQ0FBQztBQUVGO0lBQThCLDRCQUFLO0lBR2pDLGtCQUFzQixJQUFvQjtRQUExQyxZQUNFLGtCQUFNLGFBQUksQ0FBQyxTQUVaO1FBSHFCLFVBQUksR0FBSixJQUFJLENBQWdCO1FBRXhDLEtBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDOztJQUNyQixDQUFDO0lBTGEsWUFBRyxHQUFqQixjQUFzQixNQUFNLENBQUMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQU85Qyx3QkFBSyxHQUFaLFVBQWEsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRVMseUJBQU0sR0FBaEIsY0FBMEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQy9DLGVBQUM7QUFBRCxDQUFDLEFBYkQsQ0FBOEIsY0FBSyxHQWFsQztBQWJZLDRCQUFRO0FBZVIsUUFBQSxTQUFTLEdBQVksRUFDakMsQ0FBQztBQUVGLGlCQUFTLENBQUMsY0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUN2QyxpQkFBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDIn0=