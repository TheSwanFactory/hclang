"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var frames_1 = require("../frames");
var parse_pipe_1 = require("./parse-pipe");
var GroupPipe = (function (_super) {
    __extends(GroupPipe, _super);
    function GroupPipe(out) {
        return _super.call(this, out) || this;
    }
    GroupPipe.prototype.makeFrame = function () {
        var current = this.asArray();
        return new frames_1.FrameGroup(current);
    };
    return GroupPipe;
}(parse_pipe_1.ParsePipe));
exports.GroupPipe = GroupPipe;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAtcGlwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leGVjdXRlL2dyb3VwLXBpcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsb0NBQThDO0FBQzlDLDJDQUF5QztBQUd6QztJQUErQiw2QkFBUztJQUN0QyxtQkFBWSxHQUFVO2VBQ3BCLGtCQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7SUFFUyw2QkFBUyxHQUFuQjtRQUNFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMvQixNQUFNLENBQUMsSUFBSSxtQkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFDSCxnQkFBQztBQUFELENBQUMsQUFURCxDQUErQixzQkFBUyxHQVN2QztBQVRZLDhCQUFTIn0=