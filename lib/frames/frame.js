"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const meta_frame_1 = require("./meta-frame");
class Frame extends meta_frame_1.MetaFrame {
    constructor(meta = meta_frame_1.NilContext, isNil = false, isMissing = false) {
        super(meta);
        this.up = Frame.missing;
        this.is = {};
        if (isNil) {
            this.is.void = true;
        }
        if (isMissing) {
            this.is.missing = true;
        }
    }
    string_open() {
        return Frame.BEGIN_EXPR;
    }
    ;
    string_close() {
        return Frame.END_EXPR;
    }
    ;
    at(_index) {
        return Frame.nil;
    }
    in(_contexts = [Frame.nil]) {
        return this;
    }
    apply(argument, _parameter) {
        return argument;
    }
    called_by(context, parameter) {
        if (this.is.void) {
            return context;
        }
        return context.apply(this, parameter);
    }
    call(argument, parameter = Frame.nil) {
        if (this.is.void) {
            return argument;
        }
        return argument.called_by(this, parameter);
    }
    toString() {
        return this.string_open() + this.meta_string() + this.string_close();
    }
    asArray() {
        return _.castArray(this);
    }
}
exports.Frame = Frame;
Frame.kOUT = '>>';
Frame.kEND = '$$';
Frame.BEGIN_EXPR = '(';
Frame.END_EXPR = ')';
Frame.nil = new Frame(meta_frame_1.NilContext, true);
Frame.missing = new Frame(meta_frame_1.NilContext, false, true);
Frame.globals = Frame.missing;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTJCO0FBQzNCLDZDQUFvRDtBQUlwRCxNQUFhLEtBQU0sU0FBUSxzQkFBUztJQVdsQyxZQUFhLElBQUksR0FBRyx1QkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLLEVBQUUsU0FBUyxHQUFHLEtBQUs7UUFDOUQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ1gsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFBO1FBQ1osSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7U0FDcEI7UUFDRCxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtTQUN2QjtJQUNILENBQUM7SUFFTSxXQUFXO1FBQ2hCLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQTtJQUN6QixDQUFDO0lBQUEsQ0FBQztJQUVLLFlBQVk7UUFDakIsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFBO0lBQ3ZCLENBQUM7SUFBQSxDQUFDO0lBRUssRUFBRSxDQUFFLE1BQWM7UUFDdkIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFBO0lBQ2xCLENBQUM7SUFFTSxFQUFFLENBQUUsU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxLQUFLLENBQUUsUUFBZSxFQUFFLFVBQWlCO1FBQzlDLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFFTSxTQUFTLENBQUUsT0FBYyxFQUFFLFNBQWdCO1FBQ2hELElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxPQUFPLENBQUE7U0FDZjtRQUNELE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUVNLElBQUksQ0FBRSxRQUFlLEVBQUUsU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHO1FBQ2pELElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxRQUFRLENBQUE7U0FDaEI7UUFDRCxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQzVDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtJQUN0RSxDQUFDO0lBRU0sT0FBTztRQUNaLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUMxQixDQUFDOztBQS9ESCxzQkFnRUM7QUEvRHdCLFVBQUksR0FBRyxJQUFJLENBQUM7QUFDWixVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osZ0JBQVUsR0FBRyxHQUFHLENBQUM7QUFDakIsY0FBUSxHQUFHLEdBQUcsQ0FBQztBQUNmLFNBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyx1QkFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2xDLGFBQU8sR0FBVSxJQUFJLEtBQUssQ0FBQyx1QkFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM3RCxhQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQXlEdkMsQ0FBQyJ9