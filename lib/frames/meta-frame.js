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
        this.id = id;
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
            if (key === ">>") {
                return `.${key} :${value.id};`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRCQUE0QjtBQUM1QixtQ0FBZ0M7QUFRbkIsUUFBQSxVQUFVLEdBQVksRUFBRSxDQUFDO0FBSXRDLE1BQWEsU0FBUztJQUtwQixZQUFzQixPQUFPLGtCQUFVLEVBQUUsS0FBSyxHQUFHLEtBQUs7UUFBaEMsU0FBSSxHQUFKLElBQUksQ0FBYTtRQUNyQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUNuQyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNmLENBQUM7SUFFTSxRQUFRLENBQUMsR0FBVyxFQUFFLFNBQW9CLElBQUk7UUFDbkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFBRSxPQUFPLEtBQUssQ0FBQztTQUFFO1FBQUEsQ0FBQztRQUNyQyxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsU0FBb0IsSUFBSTtRQUM5QyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxJQUFJLE1BQU0sS0FBSyxhQUFLLENBQUMsT0FBTyxFQUFFO1lBQUUsT0FBTyxNQUFNLENBQUM7U0FBRTtRQUFBLENBQUM7UUFFakQsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEVBQUUsSUFBSSxhQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3RDLElBQUksTUFBTSxLQUFL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