"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameBlob extends frame_atom_1.FrameAtom {
    constructor(source, base) {
        super(meta_frame_1.NilContext);
        this.base = base;
        this.data = BigInt(source);
        this.length = source.length;
    }
    called_by(context, parameter) {
        if (context instanceof FrameBlob) {
            const left_operand = context;
            return this.exalt(left_operand);
        }
        return super.called_by(context, parameter);
    }
    string_start() {
        return FrameBlob.BLOB_START;
    }
    ;
    string_prefix() {
        const sigil = FrameBlob.BLOB_KEY[this.base];
        return "0" + sigil;
    }
    ;
    canInclude(char) {
        const regex = FrameBlob.BLOB_DIGITS[this.base];
        return regex.test(char);
    }
    toString() {
        return this.string_prefix() + this.toData().toString(this.base) + this.string_suffix();
    }
    toData() { return this.data; }
    shift_left(base, length) {
        const shift = BigInt(base * length);
        this.data = this.data << shift;
        return this;
    }
    ;
    exalt(left_operand) {
        left_operand.shift_left(this.base, this.length);
        return left_operand;
    }
    ;
}
exports.FrameBlob = FrameBlob;
FrameBlob.BLOB_START = "0";
FrameBlob.BLOB_DIGITS = {
    2: /[01]/,
    8: /[0-7]/,
    16: /[0-9a-f]/,
    32: /[0-9a-hj-np-z]/,
    64: /[0-9a-zA-Z+/=]/,
};
FrameBlob.BLOB_KEY = {
    2: "b",
    8: "o",
    16: "x",
    32: "t",
    64: "s",
};
FrameBlob.numbers = {};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYmxvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYmxvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLDZDQUF5QztBQUN6Qyw2Q0FBMEM7QUFXMUMsTUFBYSxTQUFVLFNBQVEsc0JBQVM7SUFxQnRDLFlBQVksTUFBYyxFQUFZLElBQVk7UUFDaEQsS0FBSyxDQUFDLHVCQUFVLENBQUMsQ0FBQztRQURrQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBRWhELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM5QixDQUFDO0lBRU0sU0FBUyxDQUFDLE9BQWMsRUFBRSxTQUFnQjtRQUMvQyxJQUFJLE9BQU8sWUFBWSxTQUFTLEVBQUU7WUFDaEMsTUFBTSxZQUFZLEdBQUcsT0FBb0IsQ0FBQztZQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTSxZQUFZO1FBQ2pCLE9BQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUVLLGFBQWE7UUFDbEIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0MsT0FBTyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFBQSxDQUFDO0lBRUksVUFBVSxDQUFDLElBQVk7UUFDNUIsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0lBQ3pGLENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU5QixVQUFVLENBQUMsSUFBWSxFQUFFLE1BQWM7UUFDL0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDO1FBQy9CLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUFBLENBQUM7SUFFUSxLQUFLLENBQUMsWUFBdUI7UUFDckMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRCxPQUFPLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBQUEsQ0FBQzs7QUFoRUosOEJBaUVDO0FBaEV3QixvQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixxQkFBVyxHQUFlO0lBQy9DLENBQUMsRUFBRSxNQUFNO0lBQ1QsQ0FBQyxFQUFFLE9BQU87SUFDVixFQUFFLEVBQUUsVUFBVTtJQUNkLEVBQUUsRUFBRSxnQkFBZ0I7SUFDcEIsRUFBRSxFQUFFLGdCQUFnQjtDQUNyQixDQUFDO0FBQ3FCLGtCQUFRLEdBQWU7SUFDNUMsQ0FBQyxFQUFFLEdBQUc7SUFDTixDQUFDLEVBQUUsR0FBRztJQUNOLEVBQUUsRUFBRSxHQUFHO0lBQ1AsRUFBRSxFQUFFLEdBQUc7SUFDUCxFQUFFLEVBQUUsR0FBRztDQUNSLENBQUM7QUFFZSxpQkFBTyxHQUFrQyxFQUFFLENBQUM7QUFnRDlELENBQUMifQ==