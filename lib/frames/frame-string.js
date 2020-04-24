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
    string_prefix() {
        return FrameString.STRING_BEGIN;
    }
    ;
    string_suffix() {
        return FrameString.STRING_END;
    }
    ;
    reduce(starter) {
        const final = _.reduce(this.data, reducer, starter);
        const result = final.call(frame_symbol_1.FrameSymbol.end());
        return result;
    }
    toData() {
        return this.data;
    }
}
exports.FrameString = FrameString;
FrameString.STRING_BEGIN = '“';
FrameString.STRING_END = '”';
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBMkI7QUFFM0IsNkNBQW9EO0FBQ3BELGlEQUE0QztBQUM1Qyw2Q0FBa0Q7QUFFbEQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFjLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDcEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUNuQyxPQUFPLE1BQU0sQ0FBQTtBQUNmLENBQUMsQ0FBQTtBQUVELE1BQWEsV0FBWSxTQUFRLHVCQUFVO0lBSXpDLFlBQXVCLElBQVksRUFBRSxPQUFnQix1QkFBVTtRQUM3RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFEVSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRW5DLENBQUM7SUFFTSxLQUFLLENBQUUsUUFBbUI7UUFDL0IsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFBO1FBQy9CLElBQUksUUFBUSxZQUFZLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQTtTQUN0QjtRQUNELE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQTtJQUMzQyxDQUFDO0lBRU0sYUFBYTtRQUNsQixPQUFPLFdBQVcsQ0FBQyxZQUFZLENBQUE7SUFDakMsQ0FBQztJQUFBLENBQUM7SUFFSyxhQUFhO1FBQ2xCLE9BQU8sV0FBVyxDQUFDLFVBQVUsQ0FBQTtJQUMvQixDQUFDO0lBQUEsQ0FBQztJQUVLLE1BQU0sQ0FBRSxPQUFjO1FBQzNCLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFVLENBQUE7UUFDNUQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUE7UUFDNUMsT0FBTyxNQUFNLENBQUE7SUFDZixDQUFDO0lBRVMsTUFBTTtRQUNkLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQTtJQUNsQixDQUFDOztBQWhDSCxrQ0FpQ0M7QUFoQ3dCLHdCQUFZLEdBQUcsR0FBRyxDQUFDO0FBQ25CLHNCQUFVLEdBQUcsR0FBRyxDQUFDO0FBK0J6QyxDQUFDIn0=