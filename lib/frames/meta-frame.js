"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const frame_1 = require("./frame");
exports.NilContext = {};
class MetaFrame {
    constructor(meta = exports.NilContext, isNil = false) {
        this.meta = meta;
        const name = this.constructor.name;
        const id = name + '.' + MetaFrame.id_count++;
        this.id = '$:' + id;
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
                    if (result.hasOwnProperty('source')) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWV0YS1mcmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvbWV0YS1mcmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwwQ0FBMkI7QUFDM0IsbUNBQStCO0FBT2xCLFFBQUEsVUFBVSxHQUFZLEVBQUUsQ0FBQTtBQUlyQyxNQUFhLFNBQVM7SUFLcEIsWUFBb0IsT0FBTyxrQkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLO1FBQWhDLFNBQUksR0FBSixJQUFJLENBQWE7UUFDbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUE7UUFDbEMsTUFBTSxFQUFFLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDNUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0lBQ3JCLENBQUM7SUFFTSxRQUFRLENBQUUsR0FBVyxFQUFFLFNBQW9CLElBQUk7UUFDcEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM1QixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDakIsT0FBTyxLQUFLLENBQUE7U0FDYjtRQUFBLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDN0IsQ0FBQztJQUVNLEdBQUcsQ0FBRSxHQUFXLEVBQUUsU0FBb0IsSUFBSTtRQUMvQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUN6QyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7WUFDdEIsT0FBTyxNQUFNLENBQUE7U0FDZDtRQUFBLENBQUM7UUFFRixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLGFBQUssQ0FBQyxPQUFPLENB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