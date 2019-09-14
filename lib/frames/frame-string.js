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
        return new FrameString(this.data + argument.data);
    }
    string_prefix() { return FrameString.STRING_BEGIN; }
    ;
    string_suffix() { return FrameString.STRING_END; }
    ;
    reduce(starter) {
        const final = _.reduce(this.data, reducer, starter);
        return final.call(frame_symbol_1.FrameSymbol.end());
    }
    toData() { return this.data; }
}
exports.FrameString = FrameString;
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFFNUIsNkNBQTBDO0FBQzFDLGlEQUE2QztBQUM3Qyw2Q0FBbUQ7QUFFbkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFjLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLENBQUMsQ0FBQztBQUVGLE1BQWEsV0FBWSxTQUFRLHVCQUFVO0lBSXpDLFlBQXNCLElBQVksRUFBRSxPQUFnQix1QkFBVTtRQUM1RCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFEUSxTQUFJLEdBQUosSUFBSSxDQUFRO0lBRWxDLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBcUI7UUFDaEMsT0FBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sYUFBYSxLQUFLLE9BQU8sV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELGFBQWEsS0FBSyxPQUFPLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUVuRCxNQUFNLENBQUMsT0FBYztRQUMxQixNQUFNLEtBQUssR0FBVSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNELE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQywwQkFBVyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUVTLE1BQU0sS0FBSyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQXJCMUMsa0NBdUJDO0FBdEJ3Qix3QkFBWSxHQUFHLEdBQUcsQ0FBQztBQUNuQixzQkFBVSxHQUFHLEdBQUcsQ0FBQztBQXFCekMsQ0FBQyJ9