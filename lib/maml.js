"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYW1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQWtIO0FBQ2xILDZCQUE0QjtBQUU1QixrQ0FBaUM7QUFFakMsY0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFHLENBQUM7QUFFcEIsSUFBTSxXQUFXLEdBQUcsaUJBQWlCLENBQUM7QUFFdEMsSUFBTSxPQUFPLEdBQUcsVUFBQyxJQUFZLEVBQUUsUUFBZTtJQUM1QyxNQUFNLENBQUMsSUFBSSxrQkFBUyxDQUFDO1FBQ25CLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUM7UUFDdEIsSUFBSSxvQkFBVyxDQUFDLElBQUksQ0FBQztRQUNyQixRQUFRO0tBQ1QsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDO0FBRUYsSUFBTSxTQUFTLEdBQUcsSUFBSSxrQkFBUyxDQUFDO0lBQzlCLElBQUksb0JBQVcsQ0FBQyxLQUFLLENBQUM7SUFDdEIsbUJBQVUsQ0FBQyxLQUFLLEVBQUU7SUFDbEIsaUJBQVEsQ0FBQyxJQUFJLEVBQUU7Q0FDaEIsQ0FBQyxDQUFDO0FBRUgsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUNsQixNQUFNLEVBQ04sSUFBSSxrQkFBUyxDQUFDO0lBQ1osaUJBQVEsQ0FBQyxJQUFJLEVBQUU7SUFDZixJQUFJLGtCQUFTLENBQUMsSUFBSSxDQUFDO0lBQ25CLFNBQVM7Q0FDVixDQUFDLENBQ0gsQ0FBQztBQUNGLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsaUJBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBRWpDLFFBQUEsSUFBSSxHQUFHLElBQUksa0JBQVMsQ0FBQztJQUNoQyxJQUFJLG9CQUFXLENBQUMsV0FBVyxDQUFDO0lBQzVCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxrQkFBUyxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Q0FDN0MsRUFBRSxFQUFDLEdBQUcsV0FBQSxFQUFDLENBQUMsQ0FBQyJ9