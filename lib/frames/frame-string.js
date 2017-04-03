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
var _ = require("lodash");
var frame_1 = require("./frame");
var frame_symbol_1 = require("./frame-symbol");
var reducer = function (current, char) {
    var symbol = frame_symbol_1.FrameSymbol.for(char);
    return current.call(symbol);
};
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameString.prototype.apply = function (argument) {
        return new FrameString(this.data + argument.data);
    };
    FrameString.prototype.string_prefix = function () { return FrameString.STRING_BEGIN; };
    ;
    FrameString.prototype.string_suffix = function () { return FrameString.STRING_END; };
    ;
    FrameString.prototype.reduce = function (iteratee) {
        var final = _.reduce(this.data, reducer, iteratee);
        return final.call(frame_symbol_1.FrameSymbol.end());
    };
    FrameString.prototype.toData = function () { return this.data; };
    return FrameString;
}(frame_1.FrameAtom));
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
exports.FrameString = FrameString;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUEwRDtBQUMxRCwrQ0FBNkM7QUFFN0MsSUFBTSxPQUFPLEdBQUcsVUFBQyxPQUFjLEVBQUUsSUFBWTtJQUMzQyxJQUFNLE1BQU0sR0FBRywwQkFBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUM7QUFFRjtJQUFpQywrQkFBUztJQUl4QyxxQkFBc0IsSUFBWSxFQUFFLElBQW9CO1FBQXBCLHFCQUFBLEVBQUEsbUJBQW9CO1FBQXhELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBUTs7SUFFbEMsQ0FBQztJQUVNLDJCQUFLLEdBQVosVUFBYSxRQUFxQjtRQUNoQyxNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVNLG1DQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsbUNBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVuRCw0QkFBTSxHQUFiLFVBQWMsUUFBZTtRQUMzQixJQUFNLEtBQUssR0FBVSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLDBCQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRVMsNEJBQU0sR0FBaEIsY0FBcUIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTFDLGtCQUFDO0FBQUQsQ0FBQyxBQXZCRCxDQUFpQyxpQkFBUztBQUNqQix3QkFBWSxHQUFHLEdBQUcsQ0FBQztBQUNuQixzQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUY3QixrQ0FBVztBQXVCdkIsQ0FBQyJ9