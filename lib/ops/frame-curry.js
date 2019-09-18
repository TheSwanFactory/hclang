"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class FrameCurry extends frames_1.Frame {
    constructor(Func, Source, key) {
        super();
        this.Func = Func;
        this.Source = Source;
        this.key = key;
        this.id += key;
    }
    apply(argument, _parameter) {
        return this.Func(this.Source, argument);
    }
    toString() {
        return `FrameCurry(${this.Source}, ${this.Func})`;
    }
}
exports.FrameCurry = FrameCurry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWtDO0FBSWxDLE1BQWEsVUFBVyxTQUFRLGNBQUs7SUFDbkMsWUFBc0IsSUFBb0IsRUFBWSxNQUFhLEVBQVksR0FBVztRQUN4RixLQUFLLEVBQUUsQ0FBQztRQURZLFNBQUksR0FBSixJQUFJLENBQWdCO1FBQVksV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUFZLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFFeEYsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsVUFBaUI7UUFDN0MsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLGNBQWMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUM7SUFDcEQsQ0FBQztDQUNGO0FBYkQsZ0NBYUMifQ==