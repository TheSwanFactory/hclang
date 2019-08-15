"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_1 = require("./frame");
const frame_atom_1 = require("./frame-atom");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
class FrameName extends frame_atom_1.FrameAtom {
    constructor(source, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = frame_symbol_1.FrameSymbol.for(source);
    }
    in(contexts = [frame_1.Frame.nil]) {
        const out = contexts[0];
        const setter = this.data.setter(out);
        return setter;
    }
    string_prefix() { return FrameName.NAME_BEGIN; }
    ;
    canInclude(char) {
        return frame_symbol_1.FrameSymbol.SYMBOL_CHAR.test(char);
    }
    toData() { return this.data; }
}
FrameName.NAME_BEGIN = ".";
exports.FrameName = FrameName;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtbmFtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtbmFtZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFnQztBQUNoQyw2Q0FBeUM7QUFDekMsaURBQTZDO0FBQzdDLDZDQUFtRDtBQUVuRCxlQUF1QixTQUFRLHNCQUFTO0lBS3RDLFlBQVksTUFBYyxFQUFFLElBQUksR0FBRyx1QkFBVTtRQUMzQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxHQUFHLDBCQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsYUFBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRU0sYUFBYSxLQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFakQsVUFBVSxDQUFDLElBQVk7UUFDNUIsTUFBTSxDQUFDLDBCQUFXLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRVMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUFyQmpCLG9CQUFVLEdBQUcsR0FBRyxDQUFDO0FBRDFDLDhCQXVCQztBQUFBLENBQUMifQ==