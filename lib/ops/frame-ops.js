"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
const frame_curry_1 = require("./frame-curry");
class FrameOps extends frames_1.Frame {
    constructor(OpsDict) {
        super();
        this.OpsDict = OpsDict;
    }
    get(key, origin) {
        const func = this.OpsDict[key];
        if (func != null) {
            return this.curry(func, origin, key);
        }
        return frames_1.Frame.missing;
    }
    toString() {
        return this.OpsDict.toString();
    }
    curry(func, origin, key) {
        const expr = new frame_curry_1.FrameCurry(func, origin, key);
        return expr;
    }
}
exports.FrameOps = FrameOps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtb3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9mcmFtZS1vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBa0U7QUFDbEUsK0NBQTJEO0FBSTNELE1BQWEsUUFBUyxTQUFRLGNBQUs7SUFDakMsWUFBc0IsT0FBaUI7UUFDckMsS0FBSyxFQUFFLENBQUM7UUFEWSxZQUFPLEdBQVAsT0FBTyxDQUFVO0lBRXZDLENBQUM7SUFFTSxHQUFHLENBQUMsR0FBVyxFQUFFLE1BQWE7UUFDbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDdEM7UUFFRCxPQUFPLGNBQUssQ0FBQyxPQUFPLENBQUM7SUFDdkIsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVTLEtBQUssQ0FBQyxJQUFvQixFQUFFLE1BQWEsRUFBRSxHQUFXO1FBQzlELE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBdEJELDRCQXNCQyJ9