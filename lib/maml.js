"use strict";
var frames_1 = require("./frames");
var ops_1 = require("./ops");
var tag_1 = require("./maml/tag");
frames_1.Frame.globals = ops_1.Ops;
var HTML_PREFIX = "<!DOCTYPE html>";
var MakeTag = function (name, contents) {
    return new frames_1.FrameExpr([
        new frames_1.FrameSymbol("tag"),
        new frames_1.FrameString(name),
        contents,
    ]);
};
var HeadBlock = new frames_1.FrameLazy([
    new frames_1.FrameSymbol("tag"),
    frames_1.FrameParam.there(),
    frames_1.FrameArg.here(),
]);
var head = MakeTag("head", new frames_1.FrameExpr([
    frames_1.FrameArg.here(),
    new frames_1.FrameName("&&"),
    HeadBlock,
]));
var body = MakeTag("body", frames_1.FrameArg.here());
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    MakeTag("html", new frames_1.FrameExpr([head, body])),
], { tag: tag_1.tag });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYW1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxtQ0FBa0g7QUFDbEgsNkJBQTRCO0FBRTVCLGtDQUFpQztBQUVqQyxjQUFLLENBQUMsT0FBTyxHQUFHLFNBQUcsQ0FBQztBQUVwQixJQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQztBQUV0QyxJQUFNLE9BQU8sR0FBRyxVQUFDLElBQVksRUFBRSxRQUFlO0lBQzVDLE1BQU0sQ0FBQyxJQUFJLGtCQUFTLENBQUM7UUFDbkIsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQztRQUN0QixJQUFJLG9CQUFXLENBQUMsSUFBSSxDQUFDO1FBQ3JCLFFBQVE7S0FDVCxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFFRixJQUFNLFNBQVMsR0FBRyxJQUFJLGtCQUFTLENBQUM7SUFDOUIsSUFBSSxvQkFBVyxDQUFDLEtBQUssQ0FBQztJQUN0QixtQkFBVSxDQUFDLEtBQUssRUFBRTtJQUNsQixpQkFBUSxDQUFDLElBQUksRUFBRTtDQUNoQixDQUFDLENBQUM7QUFFSCxJQUFNLElBQUksR0FBRyxPQUFPLENBQ2xCLE1BQU0sRUFDTixJQUFJLGtCQUFTLENBQUM7SUFDWixpQkFBUSxDQUFDLElBQUksRUFBRTtJQUNmLElBQUksa0JBQVMsQ0FBQyxJQUFJLENBQUM7SUFDbkIsU0FBUztDQUNWLENBQUMsQ0FDSCxDQUFDO0FBQ0YsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxpQkFBUSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7QUFFakMsUUFBQSxJQUFJLEdBQUcsSUFBSSxrQkFBUyxDQUFDO0lBQ2hDLElBQUksb0JBQVcsQ0FBQyxXQUFXLENBQUM7SUFDNUIsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLGtCQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUM3QyxFQUFFLEVBQUMsR0FBRyxXQUFBLEVBQUMsQ0FBQyxDQUFDIn0=