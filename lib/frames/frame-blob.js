"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameBlob extends frame_atom_1.FrameAtom {
    constructor(source, base) {
        super(meta_frame_1.NilContext);
        this.base = base;
        const length = source.length - 2;
        const entropy = Math.log2(base);
        const bits = length * entropy;
        this.n_bits = BigInt(bits);
        this.data = BigInt(source);
    }
    static leading_zeros(source) {
        const digits = source.substr(2);
        const match = /^0*/.exec(digits);
        const head = match[0];
        return head;
    }
    called_by(context, parameter) {
        if (context instanceof FrameBlob) {
            const left_operand = context;
            const result = left_operand.append(this);
            return result;
        }
        return super.called_by(context, parameter);
    }
    string_start() {
        return FrameBlob.BLOB_START;
    }
    ;
    string_prefix() {
        const sigil = FrameBlob.BLOB_PREFIX[this.base];
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
    append(right_operand) {
        console.error("append.this", this, "right_operand", right_operand);
        const left = right_operand.exalt(this);
        this.data = left + right_operand.data;
        this.n_bits = this.n_bits + right_operand.n_bits;
        return this;
    }
    ;
    exalt(left_operand) {
        const result = left_operand.shift_left(this.n_bits);
        return result;
    }
    ;
    shift_left(n_bits) {
        const bigint_result = this.data << n_bits;
        return bigint_result;
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
FrameBlob.BLOB_PREFIX = {
    2: "b",
    8: "o",
    16: "x",
    32: "t",
    64: "s",
};
FrameBlob.numbers = {};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYmxvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYmxvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLDZDQUF5QztBQUN6Qyw2Q0FBMEM7QUFVMUMsTUFBYSxTQUFVLFNBQVEsc0JBQVM7SUE2QnRDLFlBQVksTUFBYyxFQUFZLElBQVk7UUFDaEQsS0FBSyxDQUFDLHVCQUFVLENBQUMsQ0FBQztRQURrQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBRWhELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDaEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLE9BQU8sQ0FBQztRQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBbkJNLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBYztRQUN4QyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQWdCTSxTQUFTLENBQUMsT0FBYyxFQUFFLFNBQWdCO1FBQy9DLElBQUksT0FBTyxZQUFZLFNBQVMsRUFBRTtZQUNoQyxNQUFNLFlBQVksR0FBRyxPQUFvQixDQUFDO1lBQzFDLE1BQU0sTUFBTSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsT0FB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