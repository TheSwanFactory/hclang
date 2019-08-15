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
var meta_frame_1 = require("./meta-frame");
var frame_note_1 = require("./frame-note");
exports.FrameNote = frame_note_1.FrameNote;
var FrameSymbol = (function (_super) {
    __extends(FrameSymbol, _super);
    function FrameSymbol(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
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
    FrameSymbol.prototype.apply = function (argument, parameter) {
        var out = this.get(frame_1.Frame.kOUT);
        out.set(this.data, argument);
        return this;
    };
    FrameSymbol.prototype.setter = function (out) {
        var meta = {};
        if (!out.isVoid()) {
            meta[frame_1.Frame.kOUT] = out;
        }
        var setter = new FrameSymbol(this.data, meta);
        return setter;
    };
    FrameSymbol.prototype.called_by = function (context) {
        return this.in([context]);
    };
    FrameSymbol.prototype.string_start = function () {
        return FrameSymbol.SYMBOL_CHAR.toString();
    };
    ;
    FrameSymbol.prototype.canInclude = function (char) {
        return FrameSymbol.SYMBOL_CHAR.test(char);
    };
    FrameSymbol.prototype.toData = function () { return this.data; };
    return FrameSymbol;
}(frame_atom_1.FrameAtom));
FrameSymbol.SYMBOL_CHAR = /[-\w]/;
FrameSymbol.symbols = {};
exports.FrameSymbol = FrameSymbol;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQWdDO0FBQ2hDLDJDQUF5QztBQUN6QywyQ0FBbUQ7QUFDbkQsMkNBQXlDO0FBQWhDLGlDQUFBLFNBQVMsQ0FBQTtBQUVsQjtJQUFpQywrQkFBUztJQVl4QyxxQkFBc0IsSUFBWSxFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEsOEJBQWlCO1FBQXJELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBUTs7SUFFbEMsQ0FBQztJQVhhLGVBQUcsR0FBakIsVUFBa0IsTUFBYztRQUM5QixJQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0UsQ0FBQztJQUVhLGVBQUcsR0FBakIsY0FBc0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFRckQsd0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLEdBQUcsQ0FBQyxDQUFrQixVQUFRLEVBQVIscUJBQVEsRUFBUixzQkFBUSxFQUFSLElBQVE7WUFBekIsSUFBTSxTQUFPLGlCQUFBO1lBQ2hCLElBQU0sS0FBSyxHQUFHLFNBQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JDLEVBQUUsQ0FBQyxDQUFDLEtBQUssS0FBSyxhQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztnQkFDNUIsS0FBSyxDQUFDLEVBQUUsR0FBRyxTQUFPLENBQUM7Z0JBQ25CLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQztvQkFDM0IsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDZixDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNOLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQU8sQ0FBQyxDQUFDO2dCQUM3QixDQUFDO1lBQ0gsQ0FBQztTQUNGO1FBQ0QsTUFBTSxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUM7SUFDdkIsQ0FBQztJQUVNLDJCQUFLLEdBQVosVUFBYSxRQUFlLEVBQUUsU0FBZ0I7UUFFNUMsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sNEJBQU0sR0FBYixVQUFjLEdBQVU7UUFDdEIsSUFBTSxJQUFJLEdBQVksRUFBRSxDQUFDO1FBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQixJQUFJLENBQUMsYUFBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUN6QixDQUFDO1FBQ0QsSUFBTSxNQUFNLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNoRCxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFTSwrQkFBUyxHQUFoQixVQUFpQixPQUFjO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRU0sa0NBQVksR0FBbkI7UUFFRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBQUEsQ0FBQztJQUVLLGdDQUFVLEdBQWpCLFVBQWtCLElBQVk7UUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFUyw0QkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsa0JBQUM7QUFBRCxDQUFDLEFBN0RELENBQWlDLHNCQUFTO0FBQ2pCLHVCQUFXLEdBQUcsT0FBTyxDQUFDO0FBUzVCLG1CQUFPLEdBQW9DLEVBQUUsQ0FBQztBQVZwRCxrQ0FBVztBQTZEdkIsQ0FBQyJ9