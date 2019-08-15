"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class FrameCurry extends frames_1.Frame {
    constructor(Func, Source) {
        super();
        this.Func = Func;
        this.Source = Source;
    }
    apply(argument, parameter) {
        return this.Func(this.Source, argument);
    }
    toString() {
        return `FrameCurry(${this.Source}, ${this.Func})`;
    }
}
exports.FrameCurry = FrameCurry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQXVEO0FBSXZELGdCQUF3QixTQUFRLGNBQUs7SUFDbkMsWUFBc0IsSUFBb0IsRUFBWSxNQUFhO1FBQ2pFLEtBQUssRUFBRSxDQUFDO1FBRFksU0FBSSxHQUFKLElBQUksQ0FBZ0I7UUFBWSxXQUFNLEdBQU4sTUFBTSxDQUFPO0lBRW5FLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLFFBQVE7UUFDYixNQUFNLENBQUMsY0FBYyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFaRCxnQ0FZQyJ9