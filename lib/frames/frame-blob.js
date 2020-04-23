"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const BI = __importStar(require("big-integer"));
const frame_atom_1 = require("./frame-atom");
const meta_frame_1 = require("./meta-frame");
class FrameBlob extends frame_atom_1.FrameAtom {
    constructor(source) {
        super(meta_frame_1.NilContext);
        source = FrameBlob.fix_source(source);
        this.data = BI(source);
        this.base = FrameBlob.find_base(source);
        this.n_bits = FrameBlob.count_bits(source, this.base);
    }
    static fix_source(source) {
        if (source === '') {
            return '0' + FrameBlob.BLOB_PREFIX[16] + '0';
        }
        if (source[0] !== '0') {
            return '0' + source;
        }
        return source;
    }
    static find_base(source) {
        const prefix = source.substr(1, 1);
        const keys = Object.keys(FrameBlob.BLOB_PREFIX);
        const base = keys.find((k) => FrameBlob.BLOB_PREFIX[parseInt(k, 10)] === prefix);
        return parseInt(base, 10);
    }
    static count_bits(source, base) {
        const digits = source.substr(2);
        const length = digits.length;
        const entropy = Math.log2(base);
        const bits = length * entropy;
        return BI(bits);
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
        return '0' + sigil;
    }
    ;
    canInclude(char) {
        const regex = FrameBlob.BLOB_DIGITS[64];
        return regex.test(char);
    }
    toString() {
        const dataString = this.toData().toString(this.base);
        const pad = this.n_chars() - dataString.length;
        const digits = '0'.repeat(pad) + dataString;
        return this.string_prefix() + digits + this.string_suffix();
    }
    toData() {
        return this.data;
    }
    append(right_operand) {
        const left = right_operand.exalt(this);
        this.data = left.add(right_operand.data);
        this.n_bits = this.n_bits.add(right_operand.n_bits);
        return this;
    }
    ;
    exalt(left_operand) {
        const result = left_operand.shift_left(this.n_bits);
        return result;
    }
    ;
    shift_left(n_bits) {
        const bigint_result = this.data.shiftLeft(n_bits);
        return bigint_result;
    }
    ;
    n_chars() {
        const entropy = Math.log2(this.base);
        const bits = Number(this.n_bits);
        const chars = bits / entropy;
        return Math.ceil(chars);
    }
    ;
}
exports.FrameBlob = FrameBlob;
FrameBlob.BLOB_START = '0';
FrameBlob.BLOB_DIGITS = {
    2: /[01]/,
    8: /[0-7]/,
    16: /[0-9a-fA-F]/,
    32: /[0-9a-hj-np-z]/,
    64: /[0-9a-zA-Z+/=]/
};
FrameBlob.BLOB_PREFIX = {
    2: 'b',
    8: 'o',
    16: 'x',
    32: 't',
    64: 's'
};
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYmxvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYmxvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxnREFBaUM7QUFFakMsNkNBQXdDO0FBQ3hDLDZDQUF5QztBQVV6QyxNQUFhLFNBQVUsU0FBUSxzQkFBUztJQStDdEMsWUFBYSxNQUFjO1FBQ3pCLEtBQUssQ0FBQyx1QkFBVSxDQUFDLENBQUE7UUFDakIsTUFBTSxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFckMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdEIsSUFBSSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZELENBQUM7SUFwQ00sTUFBTSxDQUFDLFVBQVUsQ0FBRSxNQUFjO1FBQ3RDLElBQUksTUFBTSxLQUFLLEVBQUUsRUFBRTtZQUNqQixPQUFPLEdBQUcsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQTtTQUM3QztRQUNELElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUNyQixPQUFPLEdBQUcsR0FBRyxNQUFNLENBQUE7U0FDcEI7UUFDRCxPQUFPLE1BQU0sQ0FBQTtJQUNmLENBQUM7SUFFTSxNQUFNLENBQUMsU0FBUyxDQUFFLE1BQWM7UUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDbEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFD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