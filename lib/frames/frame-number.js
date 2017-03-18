"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var frame_1 = require("./frame");
var FrameNumber = (function (_super) {
    __extends(FrameNumber, _super);
    function FrameNumber(source, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.data = _.toNumber(source);
        return _this;
    }
    FrameNumber.prototype.string_prefix = function () { return FrameNumber.NUMBER_BEGIN; };
    ;
    FrameNumber.prototype.string_suffix = function () { return FrameNumber.NUMBER_END; };
    ;
    FrameNumber.prototype.toData = function () { return this.data; };
    return FrameNumber;
}(frame_1.FrameAtom));
FrameNumber.NUMBER_BEGIN = "0-9";
FrameNumber.NUMBER_END = "^0-9";
exports.FrameNumber = FrameNumber;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUEwRDtBQUUxRDtJQUFpQywrQkFBUztJQUt4QyxxQkFBWSxNQUFjLEVBQUUsSUFBb0I7UUFBcEIscUJBQUEsRUFBQSxtQkFBb0I7UUFBaEQsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FFWjtRQURDLEtBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7SUFDakMsQ0FBQztJQUVNLG1DQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsbUNBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVoRCw0QkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsa0JBQUM7QUFBRCxDQUFDLEFBZkQsQ0FBaUMsaUJBQVM7QUFDakIsd0JBQVksR0FBRyxLQUFLLENBQUM7QUFDckIsc0JBQVUsR0FBRyxNQUFNLENBQUM7QUFGaEMsa0NBQVc7QUFldkIsQ0FBQyJ9