"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var frame_1 = require("./frame");
var frame_atom_1 = require("./frame-atom");
var frame_string_1 = require("./frame-string");
var meta_frame_1 = require("./meta-frame");
var FrameNote = (function (_super) {
    __extends(FrameNote, _super);
    function FrameNote(data, source, meta) {
        if (meta === void 0) { meta = meta_frame_1.NilContext; }
        var _this = _super.call(this, meta) || this;
        _this.data = data;
        var label = FrameNote.LABELS.en[_this.data];
        if (label) {
            var value = new frame_string_1.FrameString(source);
            _this.set(label, value);
        }
        else {
            var value = new frame_string_1.FrameString(data);
            _this.set("!", value);
        }
        return _this;
    }
    FrameNote.key = function (source) { return new FrameNote("!", source); };
    ;
    FrameNote.type = function (source) { return new FrameNote("<>", source); };
    ;
    FrameNote.index = function (source) { return new FrameNote(">", source); };
    ;
    FrameNote.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this;
    };
    FrameNote.prototype.string_prefix = function () { return FrameNote.NOTE_BEGIN; };
    ;
    FrameNote.prototype.string_suffix = function () { return FrameNote.NOTE_END; };
    ;
    FrameNote.prototype.toString = function () { return this.string_prefix() + this.data + this.meta_string(); };
    return FrameNote;
}(frame_atom_1.FrameQuote));
FrameNote.NOTE_BEGIN = "$";
FrameNote.NOTE_END = ";";
FrameNote.LABELS = {
    en: {
        "!": "name-missing",
        "<>": "type-mismatch",
        ">": "bounds-exceeded",
    },
};
exports.FrameNote = FrameNote;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsMkNBQTBDO0FBQzFDLCtDQUE2QztBQUM3QywyQ0FBOEQ7QUFLOUQ7SUFBK0IsNkJBQVU7SUFnQnZDLG1CQUFzQixJQUFZLEVBQUUsTUFBYyxFQUFFLElBQWlCO1FBQWpCLHFCQUFBLEVBQUEsOEJBQWlCO1FBQXJFLFlBQ0Usa0JBQU0sSUFBSSxDQUFDLFNBU1o7UUFWcUIsVUFBSSxHQUFKLElBQUksQ0FBUTtRQUVoQyxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxLQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0MsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNWLElBQU0sS0FBSyxHQUFHLElBQUksMEJBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0QyxLQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6QixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDTixJQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDcEMsS0FBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkIsQ0FBQzs7SUFDSCxDQUFDO0lBZGEsYUFBRyxHQUFqQixVQUFrQixNQUFjLElBQUksTUFBTSxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQzNELGNBQUksR0FBbEIsVUFBbUIsTUFBYyxJQUFJLE1BQU0sQ0FBQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUM3RCxlQUFLLEdBQW5CLFVBQW9CLE1BQWMsSUFBSSxNQUFNLENBQUMsSUFBSSxTQUFTLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFjcEUsc0JBQUUsR0FBVCxVQUFVLFFBQXNCO1FBQXRCLHlCQUFBLEVBQUEsWUFBWSxhQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0saUNBQWEsR0FBcEIsY0FBeUIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVqRCxpQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRS9DLDRCQUFRLEdBQWYsY0FBb0IsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFckYsZ0JBQUM7QUFBRCxDQUFDLEFBdENELENBQStCLHVCQUFVO0FBQ2hCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGtCQUFRLEdBQUcsR0FBRyxDQUFDO0FBRWYsZ0JBQU0sR0FBb0I7SUFDL0MsRUFBRSxFQUFFO1FBQ0YsR0FBRyxFQUFFLGNBQWM7UUFDbkIsSUFBSSxFQUFFLGVBQWU7UUFDckIsR0FBRyxFQUFFLGlCQUFpQjtLQUN2QjtDQUNGLENBQUM7QUFWUyw4QkFBUztBQXNDckIsQ0FBQyJ9