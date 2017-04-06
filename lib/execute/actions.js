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
var FrameStatement = (function (_super) {
    __extends(FrameStatement, _super);
    function FrameStatement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FrameStatement;
}(frames_1.Frame));
exports.FrameStatement = FrameStatement;
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
addGroup(frames_1.FrameGroup);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsb0NBQWdGO0FBTWhGO0lBQW9DLGtDQUFLO0lBQXpDOztJQUVBLENBQUM7SUFBRCxxQkFBQztBQUFELENBQUMsQUFGRCxDQUFvQyxjQUFLLEdBRXhDO0FBRlksd0NBQWM7QUFJZCxRQUFBLE9BQU8sR0FBYztJQUNoQyxJQUFJLEVBQUUsRUFBRTtJQUNSLEdBQUcsRUFBRSxFQUFFO0lBQ1AsR0FBRyxFQUFFLEVBQUMsSUFBSSxFQUFFLGNBQWMsRUFBQztDQUM1QixDQUFDO0FBRUYsa0JBQWtCLE9BQTBCO0lBQzFDLElBQU0sTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUNsQyxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEMsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQyxDQUFDO0lBQ2hDLGVBQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUNsQyxDQUFDO0FBRUQsUUFBUSxDQUFDLG1CQUFVLENBQUMsQ0FBQyJ9