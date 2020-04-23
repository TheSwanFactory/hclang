"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class FrameCurry extends frames_1.Frame {
    constructor(Func, Source, key) {
        super();
        this.Func = Func;
        this.Source = Source;
        this.key = key;
        this.id += '.' + key;
    }
    call(argument, _parameter) {
        return this.Func(this.Source, argument);
    }
    toString() {
        return this.id;
    }
}
exports.FrameCurry = FrameCurry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWlDO0FBSWpDLE1BQWEsVUFBVyxTQUFRLGNBQUs7SUFDbkMsWUFBdUIsSUFBb0IsRUFBWSxNQUFhLEVBQVksR0FBVztRQUN6RixLQUFLLEVBQUUsQ0FBQTtRQURjLFNBQUksR0FBSixJQUFJLENBQWdCO1FBQVksV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUFZLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFFekYsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFBO0lBQ3RCLENBQUM7SUFFTSxJQUFJLENBQUUsUUFBZSxFQUFFLFVBQWlCO1FBQzdDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3pDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFBO0lBQ2hCLENBQUM7Q0FDRjtBQWJELGdDQWFDIn0=