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
var frame_atom_1 = require("./frame-atom");
var meta_frame_1 = require("./meta-frame");
var FrameNumber = (function (_super) {
    __extends(FrameNumber, _super);
    function FrameNumber(source, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = _.toNumber(source);
        return _this;
    }
    FrameNumber.prototype.toData = function () { return this.data; };
    return FrameNumber;
}(frame_atom_1.FrameAtom));
FrameNumber.NUMBER_BEGIN = "0-9";
FrameNumber.NUMBER_END = "^0-9";
exports.FrameNumber = FrameNumber;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbnVtYmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1udW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMEJBQTRCO0FBRTVCLDJDQUF5QztBQUN6QywyQ0FBbUQ7QUFFbkQ7SUFBaUMsK0JBQVM7SUFLeEMscUJBQVksTUFBYyxFQUFFLElBQTBCO1FBQTFCLHFCQUFBLEVBQUEsOEJBQTBCO1FBQXRELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBRVo7UUFEQyxLQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBQ2pDLENBQUM7SUFFUyw0QkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUMsa0JBQUM7QUFBRCxDQUFDLEFBWEQsQ0FBaUMsc0JBQVM7QUFDakIsd0JBQVksR0FBRyxLQUFLLENBQUM7QUFDckIsc0JBQVUsR0FBRyxNQUFNLENBQUM7QUFGaEMsa0NBQVc7QUFXdkIsQ0FBQyJ9