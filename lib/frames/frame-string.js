"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const frame_atom_1 = require("./frame-atom");
const frame_symbol_1 = require("./frame-symbol");
const meta_frame_1 = require("./meta-frame");
const reducer = (current, char) => {
    const symbol = frame_symbol_1.FrameSymbol.for(char);
    return current.call(symbol);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFFNUIsNkNBQXFEO0FBQ3JELGlEQUE2QztBQUM3Qyw2Q0FBbUQ7QUFFbkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFjLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQztBQUVGLE1BQWEsV0FBWSxTQUFRLHVCQUFVO0lBSXpDLFlBQXNCLElBQVksRUFBRSxPQUFnQix1QkFBVTtRQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBbUI7UUFDOUIsSUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hDLElBQUksUUFBUSxZQUFZLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztTQUN2QjtRQUNELE9BQU8sSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELGFBQWEsS0FBSyxPQUFPLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVuRCxNQUFNLENBQUMsT0FBYztRQUMxQixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBVSxDQUFDO1FBQzdELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFFUyxNQUFNLEtBQUssT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzs7QUExQjFDLGtDQTRCQztBQTNCd0Isd0JBQVksR0FBRyxHQUFHLENBQUM7QUFDbkIsc0JBQVUsR0FBRyxHQUFHLENBQUM7QUEwQnpDLENBQUMifQ==