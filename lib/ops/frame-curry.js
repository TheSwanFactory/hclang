"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class FrameCurry extends frames_1.Frame {
    constructor(Func, Source) {
        super();
        this.Func = Func;
        this.Source = Source;
    }
    apply(argument, _parameter) {
        return this.Func(this.Source, argument);
    }
    toString() {
        return `FrameCurry(${this.Source}, ${this.Func})`;
    }
}
exports.FrameCurry = FrameCurry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWtDO0FBSWxDLE1BQWEsVUFBVyxTQUFRLGNBQUs7SUFDbkMsWUFBc0IsSUFBb0IsRUFBWSxNQUFhO1FBQ2pFLEtBQUssRUFBRSxDQUFDO1FBRFksU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUFBWSxXQUFNLEdBQU4sTUFBTSxDQUFPO0lBRW5FLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBZSxFQUFFLFVBQWlCO1FBQzdDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxjQUFjLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDO0lBQ3BELENBQUM7Q0FDRjtBQVpELGdDQVlDIn0=