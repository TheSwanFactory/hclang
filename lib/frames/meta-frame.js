"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame_1 = require("./frame");
exports.NilContext = {};
class MetaFrame {
    constructor(meta = exports.NilContext, isNil = false) {
        this.meta = meta;
        const name = this.constructor.name;
        const id = name + "." + MetaFrame.id_count++;
        this.id = "$:" + id;
    }
    get_here(key, origin = this) {
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
        }).join(" ");
    }
    match_here(target) {
        let result = frame_1.Frame.missing;
        _.forOwn(this.meta, (value, key) => {
            const isPattern = key.match(/\/(.*)\//);
            if (isPattern) {
                const pattern = new RegExp(isPattern[1]);
                if (pattern.test(target)) {
                    result = value;
                    if (result.hasOwnProperty("source")) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixtQ0FBZ0M7QUFPbkIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFDO0FBSXRDLE1BQWEsU0FBUztJQUtwQixZQUFzQixPQUFPLGtCQUFVLEVBQUUsS0FBSyxHQUFHLEtBQUs7UUFBaEMsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxHQUFXLEVBQUUsU0FBb0IsSUFBSTtRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUFFLE9BQU8sS0FBSyxDQUFDO1NBQUU7UUFBQSxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxTQUFvQixJQUFJO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRTtZQUFFLE9BQU8sTUFBTSxDQUFDO1NBQUU7UUFBQSxDQUFDO1FBRTNDLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxFQUFFLElBQUksYUFBSyxDQUFDLE9BQU8sQ0FBQztRQUN0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