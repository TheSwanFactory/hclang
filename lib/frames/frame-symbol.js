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
}(frame_1.FrameAtom));
FrameSymbol.symbols = {};
exports.FrameSymbol = FrameSymbol;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3ltYm9sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zeW1ib2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsaUNBQXVEO0FBRXZEO0lBQWlDLCtCQUFTO0lBVXhDLHFCQUFzQixJQUFZLEVBQUUsSUFBaUI7UUFBakIscUJBQUEsRUFBQSx5QkFBaUI7UUFBckQsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FDWjtRQUZxQixVQUFJLEdBQUosSUFBSSxDQUFROztJQUVsQyxDQUFDO0lBWGEsZUFBRyxHQUFqQixVQUFrQixNQUFjO1FBQzlCLElBQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUMzRSxDQUFDO0lBRWEsZUFBRyxHQUFqQixjQUFzQixNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQVFyRCx3QkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsR0FBRyxDQUFDLENBQWdCLFVBQVEsRUFBUixxQkFBUSxFQUFSLHNCQUFRLEVBQVIsSUFBUTtZQUF2QixJQUFJLFNBQU8saUJBQUE7WUFDZCxJQUFJLEtBQUssR0FBRyxTQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuQyxFQUFFLENBQUMsQ0FBQyxLQUFLLEtBQUssYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLEtBQUssQ0FBQyxFQUFFLEdBQUcsU0FBTyxDQUFDO2dCQUNuQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE1BQU0sQ0FBQyxLQUFLLENBQUM7Z0JBQ2YsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDTixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFPLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNILENBQUM7U0FDRjtRQUNELE1BQU0sQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDO0lBQ3ZCLENBQUM7SUFFTSwrQkFBUyxHQUFoQixVQUFpQixPQUFjO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRVMsNEJBQU0sR0FBaEIsY0FBcUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFDLGtCQUFDO0FBQUQsQ0FBQyxBQWxDRCxDQUFpQyxpQkFBUztBQVF2QixtQkFBTyxHQUFvQyxFQUFFLENBQUM7QUFScEQsa0NBQVc7QUFrQ3ZCLENBQUMifQ==