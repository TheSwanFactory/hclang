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
var frame_string_1 = require("./frame-string");
var meta_frame_1 = require("./meta-frame");
var FrameDoc = (function (_super) {
    __extends(FrameDoc, _super);
    function FrameDoc(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        return _super.call(this, data, meta) || this;
    }
    FrameDoc.prototype.string_prefix = function () { return FrameDoc.DOC_BEGIN; };
    ;
    FrameDoc.prototype.string_suffix = function () { return FrameDoc.DOC_END; };
    ;
    return FrameDoc;
}(frame_string_1.FrameString));
FrameDoc.DOC_BEGIN = "`";
FrameDoc.DOC_END = "`";
exports.FrameDoc = FrameDoc;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZG9jLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1kb2MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBRUEsK0NBQTZDO0FBRTdDLDJDQUFtRDtBQUVuRDtJQUE4Qiw0QkFBVztJQUl2QyxrQkFBWSxJQUFZLEVBQUUsSUFBMEI7UUFBMUIscUJBQUEsRUFBQSw4QkFBMEI7ZUFDbEQsa0JBQU0sSUFBSSxFQUFFLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sZ0NBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUvQyxnQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQ3RELGVBQUM7QUFBRCxDQUFDLEFBWEQsQ0FBOEIsMEJBQVc7QUFDaEIsa0JBQVMsR0FBRyxHQUFHLENBQUM7QUFDaEIsZ0JBQU8sR0FBRyxHQUFHLENBQUM7QUFGMUIsNEJBQVE7QUFXcEIsQ0FBQyJ9