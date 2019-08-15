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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtb3BzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wcy9mcmFtZS1vcHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxzQ0FBdUQ7QUFDdkQsK0NBQTJEO0FBSTNELGNBQXNCLFNBQVEsY0FBSztJQUNqQyxZQUFzQixPQUFpQjtRQUNyQyxLQUFLLEVBQUUsQ0FBQztRQURZLFlBQU8sR0FBUCxPQUFPLENBQVU7SUFFdkMsQ0FBQztJQUVNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsTUFBYTtRQUNuQyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQy9CLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBRUQsTUFBTSxDQUFDLGNBQUssQ0FBQyxPQUFPLENBQUM7SUFDdkIsQ0FBQztJQUVNLFFBQVE7UUFDYixNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNqQyxDQUFDO0lBRVMsS0FBSyxDQUFDLElBQW9CLEVBQUUsTUFBYTtRQUNqRCxNQUFNLENBQUMsSUFBSSxrQkFBUyxDQUFDO1lBQ25CLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO1lBQzVCLGlCQUFRLENBQUMsSUFBSSxFQUFFO1NBQ2hCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhCRCw0QkF3QkMifQ==