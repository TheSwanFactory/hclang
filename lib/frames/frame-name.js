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
var frame_1 = require("./frame");
var frame_atom_1 = require("./frame-atom");
var frame_symbol_1 = require("./frame-symbol");
var meta_frame_1 = require("./meta-frame");
var FrameName = (function (_super) {
    __extends(FrameName, _super);
    function FrameName(source, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = frame_symbol_1.FrameSymbol.for(source);
        return _this;
    }
    FrameName.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        var out = contexts[0];
        console.error("\n** FrameName[" + this.data + "].out");
        console.error(out);
        var setter = this.data.setter(out);
        return setter;
    };
    FrameName.prototype.string_prefix = function () { return FrameName.NAME_BEGIN; };
    ;
    FrameName.prototype.canInclude = function (char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    };
    FrameName.prototype.toData = function () { return this.data; };
    return FrameName;
}(frame_atom_1.FrameAtom));
FrameName.NAME_BEGIN = ".";
exports.FrameName = FrameName;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsMkNBQXlDO0FBQ3pDLCtDQUE2QztBQUM3QywyQ0FBbUQ7QUFFbkQ7SUFBK0IsNkJBQVM7SUFLdEMsbUJBQVksTUFBYyxFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEsOEJBQWlCO1FBQTdDLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBRVo7UUFEQyxLQUFJLENBQUMsSUFBSSxHQUFHLDBCQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztJQUN0QyxDQUFDO0lBRU0sc0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLElBQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFrQixJQUFJLENBQUMsSUFBSSxVQUFPLENBQUMsQ0FBQztRQUNsRCxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVNLGlDQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsOEJBQVUsR0FBakIsVUFBa0IsSUFBWTtRQUM1QixNQUFNLENBQUMsMEJBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFUywwQkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsZ0JBQUM7QUFBRCxDQUFDLEFBekJELENBQStCLHNCQUFTO0FBQ2Ysb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFEN0IsOEJBQVM7QUF5QnJCLENBQUMifQ==