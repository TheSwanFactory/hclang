"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const meta_frame_1 = require("./meta-frame");
class Frame extends meta_frame_1.MetaFrame {
    constructor(meta = meta_frame_1.NilContext, isNil = false) {
        super(meta);
        this.up = Frame.missing;
        this.callme = false;
        if (isNil) {
            this.isVoid = () => {
                return true;
            };
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
        if (this.isVoid()) {
            return context;
        }
        return context.apply(this, parameter);
    }
    call(argument, parameter = Frame.nil) {
        if (this.isVoid()) {
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
    isVoid() {
        return false;
    }
    isNote() {
        return false;
    }
}
Frame.kOUT = ">>";
Frame.kEND = "$$";
Frame.BEGIN_EXPR = "(";
Frame.END_EXPR = ")";
Frame.nil = new Frame(meta_frame_1.NilContext, true);
Frame.missing = new Frame({
    missing: Frame.nil,
});
Frame.globals = Frame.missing;
exports.Frame = Frame;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLDZDQUE4RDtBQUU5RCxNQUFhLEtBQU0sU0FBUSxzQkFBUztJQVlsQyxZQUFZLElBQUksR0FBRyx1QkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLO1FBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLEtBQUssRUFBRTtZQUNULElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFO2dCQUNqQixPQUFPLElBQUksQ0FBQztZQUNkLENBQUMsQ0FBQztTQUNIO0lBQ0gsQ0FBQztJQUVNLFdBQVcsS0FBSyxPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUMzQyxZQUFZLEtBQUssT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFMUMsRUFBRSxDQUFDLEtBQWE7UUFDckIsT0FBTyxLQUFLLENBQUMsR0FBRyxDQUFDO0lBQ25CLENBQUM7SUFFTSxFQUFFLENBQUMsUUFBUSxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztRQUM5QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTSxLQUFLLENBQUMsUUFBZSxFQUFFLFNBQWdCO1FBQzVDLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFTSxTQUFTLENBQUMsT0FBYyxFQUFFLFNBQWdCO1FBQy9DLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFO1lBQ2pCLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO1FBQ0QsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUc7UUFDaEQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDakIsT0FBTyxRQUFRLENBQUM7U0FDakI7UUFDRCxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFTSxRQUFRO1FBQ2IsT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN2RSxDQUFDO0lBRU0sT0FBTztRQUNaLE9BQU8sQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRU0sTUFBTTtRQUNYLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVNLE1BQU07UUFDWCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7O0FBakVzQixVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLGdCQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGNBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixTQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxhQUFPLEdBQVUsSUFBSSxLQUFLLENBQUM7SUFDaEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHO0NBQ25CLENBQUMsQ0FBQztBQUNXLGFBQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBVHhDLHNCQW1FQztBQUFBLENBQUMifQ==