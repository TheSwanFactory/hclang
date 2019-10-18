"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const frames_1 = require("../frames");
class FrameCurry extends frames_1.Frame {
    constructor(Func, Source, key) {
        super();
        this.Func = Func;
        this.Source = Source;
        this.key = key;
        this.id += "." + key;
    }
    call(argument, _parameter) {
        return this.Func(this.Source, argument);
    }
    toString() {
        return this.id;
    }
}
exports.FrameCurry = FrameCurry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUtY3VycnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BzL2ZyYW1lLWN1cnJ5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQWtDO0FBSWxDLE1BQWEsVUFBVyxTQUFRLGNBQUs7SUFDbkMsWUFBc0IsSUFBb0IsRUFBWSxNQUFhLEVBQVksR0FBVztRQUN4RixLQUFLLEVBQUUsQ0FBQztRQURZLFNBQUksR0FBSixJQUFJLENBQWdCO1FBQVksV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUFZLFFBQUcsR0FBSCxHQUFHLENBQVE7UUFFeEYsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ3ZCLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZSxFQUFFLFVBQWlCO1FBQzVDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQWJELGdDQWFDIn0=