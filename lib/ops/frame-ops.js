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
            return this.curry(func, origin);
        }
        return frames_1.Frame.missing;
    }
    toString() {
        return this.OpsDict.toString();
    }
    curry(func, origin) {
        return new frames_1.FrameExpr([
            new frame_curry_1.FrameCurry(func, origin),
            frames_1.FrameArg.here(),
        ]);
    }
}
exports.FrameOps = FrameOps;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtb3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9mcmFtZS1vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBdUQ7QUFDdkQsK0NBQTJEO0FBSTNELE1BQWEsUUFBUyxTQUFRLGNBQUs7SUFDakMsWUFBc0IsT0FBaUI7UUFDckMsS0FBSyxFQUFFLENBQUM7UUFEWSxZQUFPLEdBQVAsT0FBTyxDQUFVO0lBRXZDLENBQUM7SUFFTSxHQUFHLENBQUMsR0FBVyxFQUFFLE1BQWE7UUFDbkMsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMvQixJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNqQztRQUVELE9BQU8sY0FBSyxDQUFDLE9BQU8sQ0FBQztJQUN2QixDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRVMsS0FBSyxDQUFDLElBQW9CLEVBQUUsTUFBYTtRQUNqRCxPQUFPLElBQUksa0JBQVMsQ0FBQztZQUNuQixJQUFJLHdCQUFVLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQztZQUM1QixpQkFBUSxDQUFDLElBQUksRUFBRTtTQUNoQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4QkQsNEJBd0JDIn0=