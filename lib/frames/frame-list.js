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
var frame_array_1 = require("./frame-array");
var FrameList = (function (_super) {
    __extends(FrameList, _super);
    function FrameList(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        return _this;
    }
    FrameList.prototype.toStringDataArray = function () {
        return this.data.map(function (obj) { return obj.toString(); });
    };
    ;
    FrameList.prototype.toStringArray = function () {
        var result = this.toStringDataArray();
        if (this.meta_length() > 0) {
            result.push(this.meta_string());
        }
        return result;
    };
    FrameList.prototype.toString = function () {
        return this.string_open() + this.toStringArray().join(", ") + this.string_close();
    };
    FrameList.prototype.asArray = function () {
        return this.data;
    };
    FrameList.prototype.size = function () {
        return this.data.length;
    };
    FrameList.prototype.array_eval = function (contexts) {
        contexts.push(this);
        return new frame_array_1.FrameArray(this.data.map(function (f) { return f.in(contexts); }));
    };
    return FrameList;
}(frame_1.Frame));
exports.FrameList = FrameList;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGlzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGlzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBc0M7QUFDdEMsNkNBQTJDO0FBRTNDO0lBQStCLDZCQUFLO0lBQ2xDLG1CQUFzQixJQUFrQixFQUFFLElBQVc7UUFBWCxxQkFBQSxFQUFBLG1CQUFXO1FBQXJELFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBQ1o7UUFGcUIsVUFBSSxHQUFKLElBQUksQ0FBYzs7SUFFeEMsQ0FBQztJQUVNLHFDQUFpQixHQUF4QjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBRSxVQUFDLEdBQVUsSUFBSyxPQUFBLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBZCxDQUFjLENBQUUsQ0FBQztJQUN6RCxDQUFDO0lBQUEsQ0FBQztJQUVLLGlDQUFhLEdBQXBCO1FBQ0UsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDeEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sNEJBQVEsR0FBZjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDcEYsQ0FBQztJQUVNLDJCQUFPLEdBQWQ7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sd0JBQUksR0FBWDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDO0lBRVMsOEJBQVUsR0FBcEIsVUFBcUIsUUFBc0I7UUFDekMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixNQUFNLENBQUMsSUFBSSx3QkFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFFLFVBQUMsQ0FBUSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBZCxDQUFjLENBQUUsQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFqQ0QsQ0FBK0IsYUFBSyxHQWlDbkM7QUFqQ1ksOEJBQVMifQ==