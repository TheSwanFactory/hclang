"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame_1 = require("./frame");
exports.NilContext = {};
class MetaFrame {
    constructor(meta = exports.NilContext, _isNil = false) {
        this.meta = meta;
        const name = this.constructor.name;
        const id = name + '.' + MetaFrame.id_count++;
        this.id = '$:' + id;
    }
    get_here(key, _origin = this) {
        const exact = this.meta[key];
        if (exact != null) {
            return exact;
        }
        ;
        return this.match_here(key);
    }
    get(key, origin = this) {
        const result = this.get_here(key, origin);
        if (!result.is.missing) {
            return result;
        }
        ;
        let parent = this.up || frame_1.Frame.globals;
        if (parent.is.missing) {
            if (frame_1.Frame.globals.is.missing) {
                return frame_1.Frame.missing;
            }
            ;
            parent = frame_1.Frame.globals;
        }
        return parent.get(key, origin);
    }
    set(key, value) {
        if (this.meta === exports.NilContext) {
            this.meta = {};
        }
        this.meta[key] = value;
        return this;
    }
    meta_copy() {
        return _.clone(this.meta);
    }
    meta_keys() {
        return _.keys(this.meta);
    }
    meta_length() {
        return this.meta_keys().length;
    }
    meta_pairs() {
        return _.map(this.meta, (value, key) => {
            return [key, value];
        });
    }
    meta_string() {
        return this.meta_pairs().map(([key, value]) => {
            if (key === frame_1.Frame.kOUT) {
                return `.${key} ${value.id};`;
            }
            else {
                return `.${key} ${value};`;
            }
        }).join(' ');
    }
    match_here(target) {
        let result = frame_1.Frame.missing;
        _.forOwn(this.meta, (value, key) => {
            const isPattern = key.match(/\/(.*)\//);
            if (isPattern) {
                const pattern = new RegExp(isPattern[1]);
                if (pattern.test(target)) {
                    result = value;
                    if (Object.prototype.hasOwnProperty('source')) {
                        const sourced = result;
                        sourced.source = target;
                    }
                }
            }
        });
        return result;
    }
}
exports.MetaFrame = MetaFrame;
MetaFrame.id_count = 0;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUEyQjtBQUMzQixtQ0FBK0I7QUFPbEIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFBO0FBSXJDLE1BQWEsU0FBUztJQUtwQixZQUFvQixPQUFPLGtCQUFVLEVBQUUsTUFBTSxHQUFHLEtBQUs7UUFBakMsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUNuQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQTtRQUNsQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUM1QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7SUFDckIsQ0FBQztJQUVNLFFBQVEsQ0FBRSxHQUFXLEVBQUUsVUFBcUIsSUFBSTtRQUNyRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1FBQzVCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUNqQixPQUFPLEtBQUssQ0FBQTtTQUNiO1FBQUEsQ0FBQztRQUNGLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBRU0sR0FBRyxDQUFFLEdBQVcsRUFBRSxTQUFvQixJQUFJO1FBQy9DLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUN0QixPQUFPLE1BQU0sQ0FBQTtTQUNkO1FBQUEsQ0FBQztRQUVGLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLE9BQU8sQ0FBQTtRQUNy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