"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame_atom_1 = require("./frame-atom");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
const reducer = (current, char) => {
    const symbol = frame_symbol_1.FrameSymbol.for(char);
    const result = current.call(symbol);
    return result;
};
class FrameString extends frame_atom_1.FrameQuote {
    constructor(data, meta = meta_frame_1.NilContext) {
        super(meta);
        this.data = data;
    }
    apply(argument) {
        let value = argument.toString();
        if (argument instanceof FrameString) {
            value = argument.data;
        }
        return new FrameString(this.data + value);
    }
    string_prefix() { return FrameString.STRING_BEGIN; }
    ;
    string_suffix() { return FrameString.STRING_END; }
    ;
    reduce(starter) {
        const final = _.reduce(this.data, reducer, starter);
        const result = final.call(frame_symbol_1.FrameSymbol.end());
        return result;
    }
    toData() { return this.data; }
}
exports.FrameString = FrameString;
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFFNUIsNkNBQXFEO0FBQ3JELGlEQUE2QztBQUM3Qyw2Q0FBbUQ7QUFFbkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFjLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNwQyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDLENBQUM7QUFFRixNQUFhLFdBQVksU0FBUSx1QkFBVTtJQUl6QyxZQUFzQixJQUFZLEVBQUUsT0FBZ0IsdUJBQVU7UUFDNUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRFEsU0FBSSxHQUFKLElBQUksQ0FBUTtJQUVsQyxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQW1CO1FBQzlCLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNoQyxJQUFJLFFBQVEsWUFBWSxXQUFXLEVBQUU7WUFDbkMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7U0FDdkI7UUFDRCxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVNLGFBQWEsS0FBSyxPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVyRCxhQUFhLEtBQUssT0FBTyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFbkQsTUFBTSxDQUFDLE9BQWM7UUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQVUsQ0FBQztRQUM3RCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLDBCQUFXLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztRQUM3QyxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBRVMsTUFBTSxLQUFLLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBMUIxQyxrQ0E0QkM7QUEzQndCLHdCQUFZLEdBQUcsR0FBRyxDQUFDO0FBQ25CLHNCQUFVLEdBQUcsR0FBRyxDQUFDO0FBMEJ6QyxDQUFDIn0=