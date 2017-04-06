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
var frame_atom_1 = require("./frame-atom");
var frame_symbol_1 = require("./frame-symbol");
var reducer = function (current, char) {
    var symbol = frame_symbol_1.FrameSymbol.for(char);
    return current.call(symbol);
};
var FrameString = (function (_super) {
    __extends(FrameString, _super);
    function FrameString(data, meta) {
        if (meta === void 0) { meta = frame_1.NilContext; }
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
}(frame_atom_1.FrameQuote));
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
exports.FrameString = FrameString;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBQzVCLGlDQUFxRDtBQUNyRCwyQ0FBMEM7QUFDMUMsK0NBQTZDO0FBRTdDLElBQU0sT0FBTyxHQUFHLFVBQUMsT0FBYyxFQUFFLElBQVk7SUFDM0MsSUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDO0FBRUY7SUFBaUMsK0JBQVU7SUFJekMscUJBQXNCLElBQVksRUFBRSxJQUEwQjtRQUExQixxQkFBQSxFQUFBLHlCQUEwQjtRQUE5RCxZQUNFLGtCQUFNLElBQUksQ0FBQyxTQUNaO1FBRnFCLFVBQUksR0FBSixJQUFJLENBQVE7O0lBRWxDLENBQUM7SUFFTSwyQkFBSyxHQUFaLFVBQWEsUUFBcUI7UUFDaEMsTUFBTSxDQUFDLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxtQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELG1DQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFbkQsNEJBQU0sR0FBYixVQUFjLFFBQWU7UUFDM0IsSUFBTSxLQUFLLEdBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1RCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVTLDRCQUFNLEdBQWhCLGNBQXFCLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUUxQyxrQkFBQztBQUFELENBQUMsQUF2QkQsQ0FBaUMsdUJBQVU7QUFDbEIsd0JBQVksR0FBRyxHQUFHLENBQUM7QUFDbkIsc0JBQVUsR0FBRyxHQUFHLENBQUM7QUFGN0Isa0NBQVc7QUF1QnZCLENBQUMifQ==