"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("./frame");
exports.NilContext = {};
var MetaFrame = (function () {
    function MetaFrame(meta, isNil) {
        if (meta === void 0) { meta = exports.NilContext; }
        if (isNil === void 0) { isNil = false; }
        this.meta = meta;
    }
    MetaFrame.prototype.get_here = function (key, origin) {
        if (origin === void 0) { origin = this; }
        var result = this.meta[key];
        if (result != null) {
            return result;
        }
        ;
        return frame_1.Frame.missing;
    };
    MetaFrame.prototype.get = function (key, origin) {
        if (origin === void 0) { origin = this; }
        var result = this.get_here(key, origin);
        if (result !== frame_1.Frame.missing) {
            return result;
        }
        ;
        var source = this.up || frame_1.Frame.globals;
        if (source === frame_1.Frame.missing) {
            if (frame_1.Frame.globals === frame_1.Frame.missing) {
                return frame_1.Frame.missing;
            }
            ;
            source = frame_1.Frame.globals;
        }
        return source.get(key, origin);
    };
    MetaFrame.prototype.set = function (key, value) {
        if (this.meta === exports.NilContext) {
            this.meta = {};
        }
        this.meta[key] = value;
        return this;
    };
    return MetaFrame;
}());
exports.MetaFrame = MetaFrame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlDQUFnQztBQUduQixRQUFBLFVBQVUsR0FBWSxFQUFFLENBQUM7QUFFdEM7SUFHRSxtQkFBc0IsSUFBaUIsRUFBRSxLQUFhO1FBQWhDLHFCQUFBLEVBQUEseUJBQWlCO1FBQUUsc0JBQUEsRUFBQSxhQUFhO1FBQWhDLFNBQUksR0FBSixJQUFJLENBQWE7SUFDdkMsQ0FBQztJQUVNLDRCQUFRLEdBQWYsVUFBZ0IsR0FBVyxFQUFFLE1BQXdCO1FBQXhCLHVCQUFBLEVBQUEsYUFBd0I7UUFDbkQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM5QixFQUFFLENBQUMsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBQUEsQ0FBQztRQUN2QyxNQUFNLENBQUMsYUFBSyxDQUFDLE9BQU8sQ0FBQztJQUN2QixDQUFDO0lBRU0sdUJBQUcsR0FBVixVQUFXLEdBQVcsRUFBRSxNQUF3QjtRQUF4Qix1QkFBQSxFQUFBLGFBQXdCO1FBQzlDLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxhQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFBQyxDQUFDO1FBQUEsQ0FBQztRQUVqRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDdEMsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzdCLEVBQUUsQ0FBQyxDQUFDLGFBQUssQ0FBQyxPQUFPLEtBQUssYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQUMsTUFBTSxDQUFDLGFBQUssQ0FBQyxPQUFPLENBQUM7WUFBQyxDQUFDO1lBQUEsQ0FBQztZQUMvRCxNQUFNLEdBQUcsYUFBSyxDQUFDLE9BQU8sQ0FBQztRQUN6QixDQUFDO1FBQ0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFTSx1QkFBRyxHQUFWLFVBQVcsR0FBVyxFQUFFLEtBQVk7UUFDbEMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxrQkFBVSxDQUFDLENBQUMsQ0FBQztZQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNqQixDQUFDO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUEvQkQsSUErQkM7QUEvQlksOEJBQVMifQ==