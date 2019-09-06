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
    canInclude(char) {
        const regex = FrameBlob.BLOB_DIGITS[this.base];
        return regex.test(char);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtYmxvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9mcmFtZXMvZnJhbWUtYmxvYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLDZDQUF5QztBQUN6Qyw2Q0FBMEM7QUFNMUMsTUFBYSxTQUFVLFNBQVEsc0JBQVM7SUFxQnRDLFlBQVksTUFBYyxFQUFZLElBQVk7UUFDaEQsS0FBSyxDQUFDLHVCQUFVLENBQUMsQ0FBQztRQURrQixTQUFJLEdBQUosSUFBSSxDQUFRO1FBRWhELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM5QixDQUFDO0lBRU0sU0FBUyxDQUFDLE9BQWMsRUFBRSxTQUFnQjtRQUMvQyxJQUFJLE9BQU8sWUFBWSxTQUFTLEVBQUU7WUFDaEMsTUFBTSxZQUFZLEdBQUcsT0FBb0IsQ0FBQztZQUMxQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDakM7UUFDRCxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTSxZQUFZO1FBQ2pCLE9BQU8sU0FBUyxDQUFDLFVBQVUsQ0FBQztJQUM5QixDQUFDO0lBQUEsQ0FBQztJQUVLLFVBQVUsQ0FBQyxJQUFZO1FBQzVCLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9DLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRVMsTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFOUIsVUFBVSxDQUFDLElBQVksRUFBRSxNQUFjO1FBQy9DLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQztRQUMvQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFBQSxDQUFDO0lBRVEsS0FBSyxDQUFDLFlBQXVCO1FBQ3JDLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEQsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztJQUFBLENBQUM7O0FBdkRKLDhCQXdEQztBQXZEd0Isb0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIscUJBQVcsR0FBZTtJQUMvQyxDQUFDLEVBQUUsTUFBTTtJQUNULENBQUMsRUFBRSxPQUFPO0lBQ1YsRUFBRSxFQUFFLFVBQVU7SUFDZCxFQUFFLEVBQUUsZ0JBQWdCO0lBQ3BCLEVBQUUsRUFBRSxnQkFBZ0I7Q0FDckIsQ0FBQztBQUNxQixrQkFBUSxHQUFHO0lBQ2hDLENBQUMsRUFBRSxHQUFHO0lBQ04sQ0FBQyxFQUFFLEdBQUc7SUFDTixFQUFFLEVBQUUsR0FBRztJQUNQLEVBQUUsRUFBRSxHQUFHO0lBQ1AsRUFBRSxFQUFFLEdBQUc7Q0FDUixDQUFDO0FBRWUsaUJBQU8sR0FBa0MsRUFBRSxDQUFDO0FBdUM5RCxDQUFDIn0=