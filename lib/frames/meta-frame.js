"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
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
        var exact = this.meta[key];
        if (exact != null) {
            return exact;
        }
        ;
        return this.match_here(key);
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
    MetaFrame.prototype.meta_copy = function () {
        return _.clone(this.meta);
    };
    MetaFrame.prototype.meta_keys = function () {
        return _.keys(this.meta);
    };
    MetaFrame.prototype.meta_length = function () {
        return this.meta_keys().length;
    };
    MetaFrame.prototype.meta_pairs = function () {
        return _.map(this.meta, function (value, key) {
            return [key, value];
        });
    };
    MetaFrame.prototype.meta_string = function () {
        return this.meta_pairs().map(function (_a) {
            var key = _a[0], value = _a[1];
            return "." + key + " " + value + ";";
        }).join(" ");
    };
    MetaFrame.prototype.match_here = function (target) {
        var result = frame_1.Frame.missing;
        _.forOwn(this.meta, function (value, key) {
            var isPattern = key.match(/\/(.*)\//);
            if (isPattern) {
                var pattern = new RegExp(isPattern[1]);
                if (pattern.test(target)) {
                    result = value;
                    if (result.hasOwnProperty("source")) {
                        var sourced = result;
                        sourced.source = target;
                    }
                }
            }
        });
        return result;
    };
    return MetaFrame;
}());
exports.MetaFrame = MetaFrame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBCQUE0QjtBQUM1QixpQ0FBZ0M7QUFPbkIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFDO0FBSXRDO0lBR0UsbUJBQXNCLElBQWlCLEVBQUUsS0FBYTtRQUFoQyxxQkFBQSxFQUFBLHlCQUFpQjtRQUFFLHNCQUFBLEVBQUEsYUFBYTtRQUFoQyxTQUFJLEdBQUosSUFBSSxDQUFhO0lBQ3ZDLENBQUM7SUFFTSw0QkFBUSxHQUFmLFVBQWdCLEdBQVcsRUFBRSxNQUF3QjtRQUF4Qix1QkFBQSxFQUFBLGFBQXdCO1FBQ25ELElBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQUMsQ0FBQztRQUFBLENBQUM7UUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVNLHVCQUFHLEdBQVYsVUFBVyxHQUFXLEVBQUUsTUFBd0I7UUFBeEIsdUJBQUEsRUFBQSxhQUF3QjtRQUM5QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssYUFBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFBQyxNQUFNLENBQUMsTUFBTSxDQUFDO1FBQUMsQ0FBQztRQUFBLENBQUM7UUFFakQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3RDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxhQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUM3QixFQUFFLENBQUMsQ0FBQyxhQUFLLENBQUMsT0FBTyxLQUFLLGFBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxhQUFLLENBQUMsT0FBTyxDQUFDO1lBQUMsQ0FBQztZQUFBLENBQUM7WUFDL0QsTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDekIsQ0FBQztRQUNELE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRU0sdUJBQUcsR0FBVixVQUFXLEdBQVcsRUFBRSxLQUFZO1FBQ2xDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssa0JBQVUsQ0FBQyxDQUFDLENBQUM7WUFDN0IsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDakIsQ0FBQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sNkJBQVMsR0FBaEI7UUFDRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQUVNLDZCQUFTLEdBQWhCO1FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFTSwrQkFBVyxHQUFsQjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsTUFBTSxDQUFDO0lBQ2pDLENBQUM7SUFFTSw4QkFBVSxHQUFqQjtRQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBQyxLQUFLLEVBQUUsR0FBRztZQUNqQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU0sK0JBQVcsR0FBbEI7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQVk7Z0JBQVgsV0FBRyxFQUFFLGFBQUs7WUFDdkMsTUFBTSxDQUFDLE1BQUksR0FBRyxTQUFJLEtBQUssTUFBRyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUM7SUFFUyw4QkFBVSxHQUFwQixVQUFxQixNQUFjO1FBQ2pDLElBQUksTUFBTSxHQUFHLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDN0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQUMsS0FBSyxFQUFFLEdBQUc7WUFDM0IsSUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN4QyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNkLElBQU0sT0FBTyxHQUFHLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekIsTUFBTSxHQUFHLEtBQUssQ0FBQztvQkFDZixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDcEMsSUFBTSxPQUFPLEdBQUcsTUFBa0IsQ0FBQzt3QkFDbkMsT0FBTyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7b0JBQzFCLENBQUM7Z0JBQ0gsQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FBQyxBQXpFRCxJQXlFQztBQXpFWSw4QkFBUyJ9