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
var FrameNote = (function (_super) {
    __extends(FrameNote, _super);
    function FrameNote(source, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = frame_symbol_1.FrameSymbol.for(source);
        return _this;
    }
    FrameNote.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this;
    };
    FrameNote.prototype.string_prefix = function () { return FrameNote.NAME_BEGIN; };
    ;
    FrameNote.prototype.canInclude = function (char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    };
    FrameNote.prototype.toData = function () { return this.data; };
    return FrameNote;
}(frame_atom_1.FrameAtom));
FrameNote.NAME_BEGIN = "$";
exports.FrameNote = FrameNote;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsMkNBQXlDO0FBQ3pDLCtDQUE2QztBQUM3QywyQ0FBbUQ7QUFFbkQ7SUFBK0IsNkJBQVM7SUFLdEMsbUJBQVksTUFBYyxFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEsOEJBQWlCO1FBQTdDLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBRVo7UUFEQyxLQUFJLENBQUMsSUFBSSxHQUFHLDBCQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztJQUN0QyxDQUFDO0lBRU0sc0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0saUNBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCw4QkFBVSxHQUFqQixVQUFrQixJQUFZO1FBQzVCLE1BQU0sQ0FBQywwQkFBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVTLDBCQUFNLEdBQWhCLGNBQXFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxnQkFBQztBQUFELENBQUMsQUFyQkQsQ0FBK0Isc0JBQVM7QUFDZixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUQ3Qiw4QkFBUztBQXFCckIsQ0FBQyJ9