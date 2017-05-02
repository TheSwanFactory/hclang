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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQWdDO0FBQ2hDLDJDQUF5QztBQUN6QywyQ0FBbUQ7QUFFbkQ7SUFBaUMsK0JBQVM7SUFZeEMscUJBQXNCLElBQVksRUFBRSxJQUFpQjtRQUFqQixxQkFBQSxFQUFBLDhCQUFpQjtRQUFyRCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQVE7O0lBRWxDLENBQUM7SUFYYSxlQUFHLEdBQWpCLFVBQWtCLE1BQWM7UUFDOUIsSUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7SUFFYSxlQUFHLEdBQWpCLGNBQXNCLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBUXJELHdCQUFFLEdBQVQsVUFBVSxRQUFzQjtRQUF0Qix5QkFBQSxFQUFBLFlBQVksYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixHQUFHLENBQUMsQ0FBa0IsVUFBUSxFQUFSLHFCQUFRLEVBQVIsc0JBQVEsRUFBUixJQUFRO1lBQXpCLElBQU0sU0FBTyxpQkFBQTtZQUNoQixJQUFNLEtBQUssR0FBRyxTQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxFQUFFLEdBQUcsU0FBTyxDQUFDO2dCQUNuQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFPLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNILENBQUM7U0FDRjtRQUNELE1BQU0sQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDO0lBQ3ZCLENBQUM7SUFFTSwrQkFBUyxHQUFoQixVQUFpQixPQUFjO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRU0sa0NBQVksR0FBbkI7UUFFRSxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBQUEsQ0FBQztJQUVLLGdDQUFVLEdBQWpCLFVBQWtCLElBQVk7UUFDNUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFUyw0QkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsa0JBQUM7QUFBRCxDQUFDLEFBN0NELENBQWlDLHNCQUFTO0FBQ2pCLHVCQUFXLEdBQUcsT0FBTyxDQUFDO0FBUzVCLG1CQUFPLEdBQW9DLEVBQUUsQ0FBQztBQVZwRCxrQ0FBVztBQTZDdkIsQ0FBQyJ9