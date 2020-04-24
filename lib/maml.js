"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("./frames");
const tag_1 = require("./maml/tag");
const HTML_PREFIX = '<!DOCTYPE html>';
const MakeTag = (name, contents) => {
    return new frames_1.FrameExpr([
        new frames_1.FrameSymbol('tag'),
        new frames_1.FrameString(name),
        contents
    ]);
};
const HeadBlock = new frames_1.FrameLazy([
    new frames_1.FrameSymbol('tag'),
    frames_1.FrameParam.there(),
    frames_1.FrameArg.here()
]);
const head = MakeTag('head', new frames_1.FrameExpr([
    frames_1.FrameArg.here(),
    new frames_1.FrameName('&&'),
    HeadBlock
]));
const body = MakeTag('body', frames_1.FrameArg.here());
exports.maml = new frames_1.FrameExpr([
    new frames_1.FrameString(HTML_PREFIX),
    MakeTag('html', new frames_1.FrameExpr([head, body]))
], { tag: tag_1.tag });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYW1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEscUNBQWlIO0FBQ2pILG9DQUFnQztBQUVoQyxNQUFNLFdBQVcsR0FBRyxpQkFBaUIsQ0FBQTtBQUVyQyxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQVksRUFBRSxRQUFlLEVBQUUsRUFBRTtJQUNoRCxPQUFPLElBQUksa0JBQVMsQ0FBQztRQUNuQixJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDO1FBQ3RCLElBQUksb0JBQVcsQ0FBQyxJQUFJLENBQUM7UUFDckIsUUFBUTtLQUNULENBQUMsQ0FBQTtBQUNKLENBQUMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHLElBQUksa0JBQVMsQ0FBQztJQUM5QixJQUFJLG9CQUFXLENBQUMsS0FBSyxDQUFDO0lBQ3RCLG1CQUFVLENBQUMsS0FBSyxFQUFFO0lBQ2xCLGlCQUFRLENBQUMsSUFBSSxFQUFFO0NBQ2hCLENBQUMsQ0FBQTtBQUVGLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FDbEIsTUFBTSxFQUNOLElBQUksa0JBQVMsQ0FBQztJQUNaLGlCQUFRLENBQUMsSUFBSSxFQUFFO0lBQ2YsSUFBSSxrQkFBUyxDQUFDLElBQUksQ0FBQztJQUNuQixTQUFTO0NBQ1YsQ0FBQyxDQUNILENBQUE7QUFDRCxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFRLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtBQUVoQyxRQUFBLElBQUksR0FBRyxJQUFJLGtCQUFTLENBQUM7SUFDaEMsSUFBSSxvQkFBVyxDQUFDLFdBQVcsQ0FBQztJQUM1QixPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksa0JBQVMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0NBQzdDLEVBQUUsRUFBRSxHQUFHLEVBQUgsU0FBRyxFQUFFLENBQUMsQ0FBQSJ9