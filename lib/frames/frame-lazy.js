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
var frame_expr_1 = require("./frame-expr");
var FrameLazy = (function (_super) {
    __extends(FrameLazy, _super);
    function FrameLazy(data, meta) {
        if (meta === void 0) { meta = frame_1.Void; }
        return _super.call(this, data, meta) || this;
    }
    FrameLazy.prototype.string_open = function () { return FrameLazy.LAZY_BEGIN + " "; };
    ;
    FrameLazy.prototype.string_close = function () { return " " + FrameLazy.LAZY_END; };
    ;
    FrameLazy.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        if (this.data.length === 0) {
            return this;
        }
        var expr = new frame_expr_1.FrameExpr(this.data, this.meta_for(contexts[0]));
        expr.up = this;
        return expr;
    };
    FrameLazy.prototype.call = function (argument, parameter) {
        if (parameter === void 0) { parameter = frame_1.Frame.nil; }
        return new frame_expr_1.FrameExpr(argument.asArray(), this.meta_for(argument));
    };
    FrameLazy.prototype.meta_for = function (context) {
        var MetaNew = this.meta_copy();
        var pairs = context.meta_pairs();
        pairs.map(function (_a) {
            var key = _a[0], value = _a[1];
            MetaNew[key] = value;
        });
        return MetaNew;
    };
    return FrameLazy;
}(frame_expr_1.FrameExpr));
FrameLazy.LAZY_BEGIN = "{";
FrameLazy.LAZY_END = "}";
exports.FrameLazy = FrameLazy;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbGF6eS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbGF6eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBOEQ7QUFDOUQsMkNBQXlDO0FBRXpDO0lBQStCLDZCQUFTO0lBSXRDLG1CQUFZLElBQWtCLEVBQUUsSUFBb0I7UUFBcEIscUJBQUEsRUFBQSxtQkFBb0I7ZUFDbEQsa0JBQU0sSUFBSSxFQUFFLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRU0sK0JBQVcsR0FBbEIsY0FBdUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDckQsZ0NBQVksR0FBbkIsY0FBd0IsTUFBTSxDQUFFLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFckQsc0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxJQUFNLElBQUksR0FBRyxJQUFJLHNCQUFTLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEUsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDZixNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLHdCQUFJLEdBQVgsVUFBWSxRQUFlLEVBQUUsU0FBcUI7UUFBckIsMEJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHO1FBQ2hELE1BQU0sQ0FBQyxJQUFJLHNCQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRVMsNEJBQVEsR0FBbEIsVUFBbUIsT0FBYztRQUMvQixJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDL0IsSUFBSSxLQUFLLEdBQXlCLE9BQU8sQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN2RCxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBWTtnQkFBWCxXQUFHLEVBQUUsYUFBSztZQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7UUFBQyxDQUFDLENBQUMsQ0FBQztRQUN2RCxNQUFNLENBQUMsT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUE5QkQsQ0FBK0Isc0JBQVM7QUFDZixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixrQkFBUSxHQUFHLEdBQUcsQ0FBQztBQUYzQiw4QkFBUztBQThCckIsQ0FBQyJ9