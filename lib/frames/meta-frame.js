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
        if (result !== frame_1.Frame.missing) {
            return result;
        }
        ;
        let source = this.up || frame_1.Frame.globals;
        if (source === frame_1.Frame.missing) {
            if (frame_1.Frame.globals === frame_1.Frame.missing) {
                return frame_1.Frame.missing;
            }
            ;
            source = frame_1.Frame.globals;
        }
        return source.get(key, origin);
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
MetaFrame.id_count = 0;
exports.MetaFrame = MetaFrame;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixtQ0FBZ0M7QUFRbkIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFDO0FBSXRDLE1BQWEsU0FBUztJQUtwQixZQUFzQixPQUFPLGtCQUFVLEVBQUUsS0FBSyxHQUFHLEtBQUs7UUFBaEMsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUVNLFFBQVEsQ0FBQyxHQUFXLEVBQUUsU0FBb0IsSUFBSTtRQUNuRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUFFLE9BQU8sS0FBSyxDQUFDO1NBQUU7UUFBQSxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxTQUFvQixJQUFJO1FBQzlDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLElBQUksTUFBTSxLQUFLLGFBQUssQ0FBQyxPQUFPLEVBQUU7WUFBRSxPQUFPLE1BQU0sQ0FBQztTQUFFO1FBQUEsQ0FBQztRQUVqRCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxPQUFPLENBQUM7UUFDdEMsSUFB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