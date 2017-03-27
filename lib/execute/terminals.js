"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
exports.ender = function (source, parameter) {
    var pipe = source;
    return pipe.finish();
};
exports.next = function (source, parameter) {
    var pipe = source;
    return pipe.next();
};
var Terminal = (function (_super) {
    __extends(Terminal, _super);
    function Terminal(data) {
        var _this = _super.call(this, frames_1.Void) || this;
        _this.data = data;
        _this.callme = true;
        return _this;
    }
    Terminal.end = function () { return new Terminal(exports.ender); };
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
exports.terminals["\n"] = new Terminal(exports.next);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVybWluYWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2V4ZWN1dGUvdGVybWluYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLG9DQUEyRTtBQUs5RCxRQUFBLEtBQUssR0FBbUIsVUFBQyxNQUFhLEVBQUUsU0FBZ0I7SUFDbkUsSUFBTSxJQUFJLEdBQUcsTUFBaUIsQ0FBQztJQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUVXLFFBQUEsSUFBSSxHQUFtQixVQUFDLE1BQWEsRUFBRSxTQUFnQjtJQUNsRSxJQUFNLElBQUksR0FBRyxNQUFpQixDQUFDO0lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDckIsQ0FBQyxDQUFDO0FBRUY7SUFBOEIsNEJBQUs7SUFHakMsa0JBQXNCLElBQW9CO1FBQTFDLFlBQ0Usa0JBQU0sYUFBSSxDQUFDLFNBRVo7UUFIcUIsVUFBSSxHQUFKLElBQUksQ0FBZ0I7UUFFeEMsS0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7O0lBQ3JCLENBQUM7SUFMYSxZQUFHLEdBQWpCLGNBQXNCLE1BQU0sQ0FBQyxJQUFJLFFBQVEsQ0FBQyxhQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBTzdDLHdCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFUyx5QkFBTSxHQUFoQixjQUEwQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDL0MsZUFBQztBQUFELENBQUMsQUFiRCxDQUE4QixjQUFLLEdBYWxDO0FBYlksNEJBQVE7QUFlUixRQUFBLFNBQVMsR0FBWSxFQUNqQyxDQUFDO0FBRUYsaUJBQVMsQ0FBQyxjQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZDLGlCQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxRQUFRLENBQUMsWUFBSSxDQUFDLENBQUMifQ==