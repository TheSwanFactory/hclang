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
var FrameName = (function (_super) {
    __extends(FrameName, _super);
    function FrameName(source, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = frame_symbol_1.FrameSymbol.for(source);
        return _this;
    }
    FrameName.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this.data;
    };
    FrameName.prototype.string_prefix = function () { return FrameName.NAME_BEGIN; };
    ;
    FrameName.prototype.toData = function () { return this.data; };
    return FrameName;
}(frame_atom_1.FrameAtom));
FrameName.NAME_BEGIN = ".";
exports.FrameName = FrameName;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBNEM7QUFDNUMsMkNBQXlDO0FBQ3pDLCtDQUE2QztBQUU3QztJQUErQiw2QkFBUztJQUt0QyxtQkFBWSxNQUFjLEVBQUUsSUFBaUI7UUFBakIscUJBQUEsRUFBQSx5QkFBaUI7UUFBN0MsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FFWjtRQURDLEtBQUksQ0FBQyxJQUFJLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBQ3RDLENBQUM7SUFFTSxzQkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVNLGlDQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFOUMsMEJBQU0sR0FBaEIsY0FBcUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFDLGdCQUFDO0FBQUQsQ0FBQyxBQWpCRCxDQUErQixzQkFBUztBQUNmLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBRDdCLDhCQUFTO0FBaUJyQixDQUFDIn0=