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
var FrameSymbol = (function (_super) {
    __extends(FrameSymbol, _super);
    function FrameSymbol(data, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameSymbol.for = function (symbol) {
        var exists = FrameSymbol.symbols[symbol];
        return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
    };
    FrameSymbol.end = function () { return FrameSymbol.for(frame_1.Frame.kEND); };
    ;
    FrameSymbol.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        for (var _i = 0, contexts_1 = contexts; _i < contexts_1.length; _i++) {
            var context_1 = contexts_1[_i];
            var value = context_1.get(this.data);
            if (value !== frame_1.Frame.missing) {
                value.up = context_1;
                if (value.callme === false) {
                    return value;
                }
                else {
                    return value.call(context_1);
                }
            }
        }
        return frame_1.Frame.missing;
    };
    FrameSymbol.prototype.called_by = function (context) {
        return this.in([context]);
    };
    FrameSymbol.prototype.toData = function () { return this.data; };
    return FrameSymbol;
}(frame_atom_1.FrameAtom));
FrameSymbol.symbols = {};
exports.FrameSymbol = FrameSymbol;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQTRDO0FBQzVDLDJDQUF5QztBQUV6QztJQUFpQywrQkFBUztJQVV4QyxxQkFBc0IsSUFBWSxFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEseUJBQWlCO1FBQXJELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBUTs7SUFFbEMsQ0FBQztJQVhhLGVBQUcsR0FBakIsVUFBa0IsTUFBYztRQUM5QixJQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVhLGVBQUcsR0FBakIsY0FBc0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFRckQsd0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLEdBQUcsQ0FBQyxDQUFnQixVQUFRLEVBQVIscUJBQVEsRUFBUixzQkFBUSxFQUFSLElBQVE7WUFBdkIsSUFBSSxTQUFPLGlCQUFBO1lBQ2QsSUFBSSxLQUFLLEdBQUcsU0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkMsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixLQUFLLENBQUMsRUFBRSxHQUFHLFNBQU8sQ0FBQztnQkFDbkIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUMzQixNQUFNLENBQUMsS0FBSyxDQUFDO2dCQUNmLENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ04sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBTyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7WUFDSCxDQUFDO1NBQ0Y7UUFDRCxNQUFNLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQztJQUN2QixDQUFDO0lBRU0sK0JBQVMsR0FBaEIsVUFBaUIsT0FBYztRQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVTLDRCQUFNLEdBQWhCLGNBQXFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxrQkFBQztBQUFELENBQUMsQUFsQ0QsQ0FBaUMsc0JBQVM7QUFRdkIsbUJBQU8sR0FBb0MsRUFBRSxDQUFDO0FBUnBELGtDQUFXO0FBa0N2QixDQUFDIn0=