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
        var value = new frame_string_1.FrameString(source);
        _this.set(label, value);
        return _this;
    }
    FrameNote.prototype.in = function (contexts) {
        if (contexts === void 0) { contexts = [frame_1.Frame.nil]; }
        return this;
    };
    FrameNote.prototype.string_prefix = function () { return FrameNote.NOTE_BEGIN; };
    ;
    FrameNote.prototype.string_suffix = function () { return FrameNote.NOTE_END; };
    ;
    FrameNote.prototype.toString = function () { return this.string_prefix() + this.data + this.meta_string(); };
    FrameNote.prototype.toData = function () { return this.data; };
    return FrameNote;
}(frame_atom_1.FrameQuote));
FrameNote.NOTE_BEGIN = "$";
FrameNote.NOTE_END = "";
FrameNote.MISSING = "!";
FrameNote.MISMATCH = "<>";
FrameNote.LABELS = {
    en: {
        "!": "name-missing",
        "<>": "type-mismatch",
    },
};
exports.FrameNote = FrameNote;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbm90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxpQ0FBZ0M7QUFDaEMsMkNBQTBDO0FBQzFDLCtDQUE2QztBQUM3QywyQ0FBOEQ7QUFLOUQ7SUFBK0IsNkJBQVU7SUFjdkMsbUJBQXNCLElBQVksRUFBRSxNQUFjLEVBQUUsSUFBaUI7UUFBakIscUJBQUEsRUFBQSw4QkFBaUI7UUFBckUsWUFDRSxrQkFBTSxJQUFJLENBQUMsU0FJWjtRQUxxQixVQUFJLEdBQUosSUFBSSxDQUFRO1FBRWhDLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QyxJQUFNLEtBQUssR0FBRyxJQUFJLDBCQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsS0FBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7O0lBQ3pCLENBQUM7SUFFTSxzQkFBRSxHQUFULFVBQVUsUUFBc0I7UUFBdEIseUJBQUEsRUFBQSxZQUFZLGFBQUssQ0FBQyxHQUFHLENBQUM7UUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxpQ0FBYSxHQUFwQixjQUF5QixNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRWpELGlDQUFhLEdBQXBCLGNBQXlCLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFL0MsNEJBQVEsR0FBZixjQUFvQixNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV6RSwwQkFBTSxHQUFoQixjQUFxQixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFMUMsZ0JBQUM7QUFBRCxDQUFDLEFBakNELENBQStCLHVCQUFVO0FBQ2hCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGtCQUFRLEdBQUcsRUFBRSxDQUFDO0FBRWQsaUJBQU8sR0FBRyxHQUFHLENBQUM7QUFDZCxrQkFBUSxHQUFHLElBQUksQ0FBQztBQUVoQixnQkFBTSxHQUFvQjtJQUMvQyxFQUFFLEVBQUU7UUFDRixHQUFHLEVBQUUsY0FBYztRQUNuQixJQUFJLEVBQUUsZUFBZTtLQUN0QjtDQUNGLENBQUM7QUFaUyw4QkFBUztBQWlDckIsQ0FBQyJ9