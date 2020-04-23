"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtc3RyaW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2ZyYW1lcy9mcmFtZS1zdHJpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsMENBQTJCO0FBRTNCLDZDQUFvRDtBQUNwRCxpREFBNEM7QUFDNUMsNkNBQWtEO0FBRWxELE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBYyxFQUFFLElBQVksRUFBRSxFQUFFO0lBQy9DLE1BQU0sTUFBTSxHQUFHLDBCQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3BDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7SUFDbkMsT0FBTyxNQUFNLENBQUE7QUFDZixDQUFDLENBQUE7QUFFRCxNQUFhLFdBQVksU0FBUSx1QkFBVTtJQUl6QyxZQUF1QixJQUFZLEVBQUUsT0FBZ0IsdUJBQVU7UUFDN0QsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRFUsU0FBSSxHQUFKLElBQUksQ0FBUTtJQUVuQyxDQUFDO0lBRU0sS0FBSyxDQUFFLFFBQW1CO1FBQy9CLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQTtRQUMvQixJQUFJLFFBQVEsWUFBWSxXQUFXLEVBQUU7WUFDbkMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUE7U0FDdEI7UUFDRCxPQUFPLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUE7SUFDM0MsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxXQUFXLENBQUMsWUFBWSxDQUFBO0lBQ2pDLENBQUM7SUFBQSxDQUFDO0lBRUssYUFBYTtRQUNsQixPQUFPLFdBQVcsQ0FBQyxVQUFVLENBQUE7SUFDL0IsQ0FBQztJQUFBLENBQUM7SUFFSyxNQUFNLENBQUUsT0FBYztRQUMzQixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBVSxDQUFBO1FBQzVELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsMEJBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFBO1FBQzVDLE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVTLE1BQU07UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDbEIsQ0FBQzs7QUFoQ0gsa0NBaUNDO0FBaEN3Qix3QkFBWSxHQUFHLEdBQUcsQ0FBQztBQUNuQixzQkFBVSxHQUFHLEdBQUcsQ0FBQztBQStCekMsQ0FBQyJ9