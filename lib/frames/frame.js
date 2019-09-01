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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLDZDQUE4RDtBQUk5RCxNQUFhLEtBQU0sU0FBUSxzQkFBUztJQWFsQyxZQUFZLElBQUksR0FBRyx1QkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLO1FBQzFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUN4QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLEVBQUU7Z0JBQ2pCLE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUFDO1NBQ0g7SUFDSCxDQUFDO0lBRU0sV0FBVyxLQUFLLE9BQU8sS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBQzNDLFlBQVksS0FBSyxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUUxQyxFQUFFLENBQUMsS0FBYTtRQUNyQixPQUFPLEtBQUssQ0FBQyxHQUFHLENBQUM7SUFDbkIsQ0FBQztJQUVNLEVBQUUsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1FBQzlCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFlLEVBQUUsU0FBZ0I7UUFDNUMsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVNLFNBQVMsQ0FBQyxPQUFjLEVBQUUsU0FBZ0I7UUFDL0MsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUU7WUFDakIsT0FBTyxPQUFPLENBQUM7U0FDaEI7UUFDRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxJQUFJLENBQUMsUUFBZSxFQUFFLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRztRQUNoRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRTtZQUNqQixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUNELE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3ZFLENBQUM7SUFFTSxPQUFPO1FBQ1osT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0lBRU0sTUFBTTtRQUNYLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQzs7QUFuRUgsc0JBb0VDO0FBbkV3QixVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLGdCQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGNBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixTQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxhQUFPLEdBQVUsSUFBSSxLQUFLLENBQUM7SUFDaEQsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHO0NBQ25CLENBQUMsQ0FBQztBQUNXLGFBQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBMkR2QyxDQUFDIn0=