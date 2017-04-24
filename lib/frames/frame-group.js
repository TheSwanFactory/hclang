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
var frame_list_1 = require("./frame-list");
var meta_frame_1 = require("./meta-frame");
var FrameGroup = (function (_super) {
    __extends(FrameGroup, _super);
    function FrameGroup(data, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        return _super.call(this, data, meta) || this;
    }
    FrameGroup.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        if (this.size() > 1) {
            return this.array_eval(contexts);
        }
        var expr = this.data[0];
        contexts.push(this);
        var result = expr.in(contexts);
        this.meta_pairs().map(function (_a) {
            var key = _a[0], value = _a[1];
            result.set(key, value);
        });
        return result;
    };
    return FrameGroup;
}(frame_list_1.FrameList));
exports.FrameGroup = FrameGroup;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLWdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFnQztBQUNoQywyQ0FBeUM7QUFDekMsMkNBQW1EO0FBRW5EO0lBQWdDLDhCQUFTO0lBQ3ZDLG9CQUFZLElBQWtCLEVBQUUsSUFBaUI7UUFBakIscUJBQUEsRUFBQSw4QkFBaUI7ZUFDL0Msa0JBQU0sSUFBSSxFQUFFLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sdUJBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BCLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBWTtnQkFBWCxXQUFHLEVBQUUsYUFBSztZQUNoQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUNILGlCQUFDO0FBQUQsQ0FBQyxBQWpCRCxDQUFnQyxzQkFBUyxHQWlCeEM7QUFqQlksZ0NBQVUifQ==