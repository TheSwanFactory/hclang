"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const meta_frame_1 = require("./meta-frame");
class Frame extends meta_frame_1.MetaFrame {
    constructor(meta = meta_frame_1.NilContext, isNil = false) {
        super(meta);
        this.up = Frame.missing;
        this.is = {};
        if (isNil) {
            this.is.void = true;
        }
    }
    string_open() { return Frame.BEGIN_EXPR; }
    ;
    string_close() { return Frame.END_EXPR; }
    ;
    at(index) {
        return Frame.nil;
    }
    in(contexts = [Frame.nil]) {
        return this;
    }
    apply(argument, parameter) {
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
    isNote() {
        return false;
    }
}
exports.Frame = Frame;
Frame.kOUT = ">>";
Frame.kEND = "$$";
Frame.BEGIN_EXPR = "(";
Frame.END_EXPR = ")";
Frame.nil = new Frame(meta_frame_1.NilContext, true);
Frame.missing = new Frame({
    missing: Frame.nil,
});
Frame.globals = Frame.missing;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLDZDQUE4RDtBQUk5RCxNQUFhLEtBQU0sU0FBUSxzQkFBUztJQWFsQyxZQUFZLElBQUksR0FBRyx1QkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLO1FBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ3JCO0lBQ0gsQ0FBQztJQUVNLFdBQVcsS0FBSyxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMzQyxZQUFZLEtBQUssT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUMsRUFBRSxDQUFDLEtBQWE7UUFDckIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFTSxTQUFTLENBQUMsT0FBYyxFQUFFLFNBQWdCO1FBQy9DLElBQUksSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUU7WUFDaEIsT0FBTyxPQUFPLENBQUM7U0FDaEI7UUFDRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZSxFQUFFLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRztRQUNoRCxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ2hCLE9BQU8sUUFBUSxDQUFDO1NBQ2pCO1FBQ0QsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM3QyxDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDdkUsQ0FBQztJQUVNLE9BQU87UUFDWixPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVNLE1BQU07UUFDWCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7O0FBN0RILHNCQThEQztBQTdEd0IsVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLFVBQUksR0FBRyxJQUFJLENBQUM7QUFDWixnQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixjQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsU0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEMsYUFBTyxHQUFVLElBQUksS0FBSyxDQUFDO0lBQ2hELE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRztDQUNuQixDQUFDLENBQUM7QUFDVyxhQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztBQXFEdkMsQ0FBQyJ9