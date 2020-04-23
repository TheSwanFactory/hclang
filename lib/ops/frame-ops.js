"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("../frames/frame");
const frame_curry_1 = require("./frame-curry");
class FrameOps extends frame_1.Frame {
    constructor(OpsDict) {
        super();
        this.OpsDict = OpsDict;
    }
    get(key, origin) {
        const func = this.OpsDict[key];
        if (func != null) {
            return this.curry(func, origin, key);
        }
        return frame_1.Frame.missing;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtb3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9mcmFtZS1vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBdUM7QUFDdkMsK0NBQTBEO0FBSTFELE1BQWEsUUFBUyxTQUFRLGFBQUs7SUFDakMsWUFBdUIsT0FBaUI7UUFDdEMsS0FBSyxFQUFFLENBQUE7UUFEYyxZQUFPLEdBQVAsT0FBTyxDQUFVO0lBRXhDLENBQUM7SUFFTSxHQUFHLENBQUUsR0FBVyxFQUFFLE1BQWE7UUFDcEMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUM5QixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUE7U0FDckM7UUFFRCxPQUFPLGFBQUssQ0FBQyxPQUFPLENBQUE7SUFDdEIsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDaEMsQ0FBQztJQUVTLEtBQUssQ0FBRSxJQUFvQixFQUFFLE1BQWEsRUFBRSxHQUFXO1FBQy9ELE1BQU0sSUFBSSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQzlDLE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBdEJELDRCQXNCQyJ9