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
    reduce(iteratee) {
        const final = _.reduce(this.data, reducer, iteratee);
        return final.call(frame_symbol_1.FrameSymbol.end());
    }
    toData() { return this.data; }
}
FrameString.STRING_BEGIN = "“";
FrameString.STRING_END = "”";
exports.FrameString = FrameString;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSw0QkFBNEI7QUFFNUIsNkNBQTBDO0FBQzFDLGlEQUE2QztBQUM3Qyw2Q0FBbUQ7QUFFbkQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxPQUFjLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsMEJBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsQ0FBQyxDQUFDO0FBRUYsaUJBQXlCLFNBQVEsdUJBQVU7SUFJekMsWUFBc0IsSUFBWSxFQUFFLE9BQWdCLHVCQUFVO1FBQzVELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURRLFNBQUksR0FBSixJQUFJLENBQVE7SUFFbEMsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFxQjtRQUNoQyxNQUFNLENBQUMsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVNLGFBQWEsS0FBSyxNQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRXJELGFBQWEsS0FBSyxNQUFNLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRW5ELE1BQU0sQ0FBQyxRQUFlO1FBQzNCLE1BQU0sS0FBSyxHQUFVLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDNUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFUyxNQUFNLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDOztBQXBCakIsd0JBQVksR0FBRyxHQUFHLENBQUM7QUFDbkIsc0JBQVUsR0FBRyxHQUFHLENBQUM7QUFGMUMsa0NBdUJDO0FBQUEsQ0FBQyJ9