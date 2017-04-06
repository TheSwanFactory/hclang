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
var frame = require("../frames");
var FrameStatement = (function (_super) {
    __extends(FrameStatement, _super);
    function FrameStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FrameStatement;
}(frame.Frame));
exports.FrameStatement = FrameStatement;
var FrameLazyGroup = (function (_super) {
    __extends(FrameLazyGroup, _super);
    function FrameLazyGroup(data, meta) {
        if (meta === void 0) { meta = frame.NilContext; }
        var _this = this;
        var group = new frame.FrameGroup(data);
        _this = _super.call(this, [group], meta) || this;
        return _this;
    }
    return FrameLazyGroup;
}(frame.FrameLazy));
exports.FrameLazyGroup = FrameLazyGroup;
;
exports.actions = {
    "\n": {},
    ",": {},
    ";": { wrap: FrameStatement },
};
function addGroup(grouper) {
    var sample = new grouper([]);
    var open = sample.string_open();
    var close = sample.string_close();
    exports.actions[open] = { push: grouper };
    exports.actions[close] = { pop: grouper };
}
addGroup(frame.FrameGroup);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQW1DO0FBTW5DO0lBQW9DLGtDQUFXO0lBQS9DOztJQUVBLENBQUM7SUFBRCxxQkFBQztBQUFELENBQUMsQUFGRCxDQUFvQyxLQUFLLENBQUMsS0FBSyxHQUU5QztBQUZZLHdDQUFjO0FBSTNCO0lBQW9DLGtDQUFlO0lBQ2pELHdCQUFZLElBQTRCLEVBQUUsSUFBc0M7UUFBdEMscUJBQUEsRUFBQSxPQUFzQixLQUFLLENBQUMsVUFBVTtRQUFoRixpQkFHQztRQUZDLElBQU0sS0FBSyxHQUFHLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QyxRQUFBLGtCQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQUM7O0lBQ3ZCLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUFMRCxDQUFvQyxLQUFLLENBQUMsU0FBUyxHQUtsRDtBQUxZLHdDQUFjO0FBSzFCLENBQUM7QUFFVyxRQUFBLE9BQU8sR0FBYztJQUNoQyxJQUFJLEVBQUUsRUFBRTtJQUNSLEdBQUcsRUFBRSxFQUFFO0lBQ1AsR0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLGNBQWMsRUFBQztDQUM1QixDQUFDO0FBRUYsa0JBQWtCLE9BQVk7SUFDNUIsSUFBTSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDL0IsSUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ2xDLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUNwQyxlQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQyxJQUFJLEVBQUUsT0FBTyxFQUFDLENBQUM7SUFDaEMsZUFBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUMsR0FBRyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQ2xDLENBQUM7QUFFRCxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDIn0=