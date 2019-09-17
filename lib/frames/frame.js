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
    string_open() { return Frame.BEGIN_EXPR; }
    ;
    string_close() { return Frame.END_EXPR; }
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
Frame.kOUT = ">>";
Frame.kEND = "$$";
Frame.BEGIN_EXPR = "(";
Frame.END_EXPR = ")";
Frame.nil = new Frame(meta_frame_1.NilContext, true);
Frame.missing = new Frame(meta_frame_1.NilContext, false, true);
Frame.globals = Frame.missing;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNEJBQTRCO0FBQzVCLDZDQUFxRDtBQUlyRCxNQUFhLEtBQU0sU0FBUSxzQkFBUztJQVdsQyxZQUFZLElBQUksR0FBRyx1QkFBVSxFQUFFLEtBQUssR0FBRyxLQUFLLEVBQUUsU0FBUyxHQUFHLEtBQUs7UUFDN0QsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7U0FDckI7UUFDRCxJQUFJLFNBQVMsRUFBRTtZQUNiLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUN4QjtJQUNILENBQUM7SUFFTSxXQUFXLEtBQUssT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFDM0MsWUFBWSxLQUFLLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFBQSxDQUFDO0lBRTFDLEVBQUUsQ0FBQyxNQUFjO1FBQ3RCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQztJQUNuQixDQUFDO0lBRU0sRUFBRSxDQUFDLFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDL0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQWUsRUFBRSxVQUFpQjtRQUM3QyxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRU0sU0FBUyxDQUFDLE9BQWMsRUFBRSxTQUFnQjtRQUMvQyxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ2hCLE9BQU8sT0FBTyxDQUFDO1NBQ2hCO1FBQ0QsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRU0sSUFBSSxDQUFDLFFBQWUsRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUc7UUFDaEQsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtZQUNoQixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUNELE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVNLFFBQVE7UUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQ3ZFLENBQUM7SUFFTSxPQUFPO1FBQ1osT0FBTyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7O0FBMURILHNCQTJEQztBQTFEd0IsVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLFVBQUksR0FBRyxJQUFJLENBQUM7QUFDWixnQkFBVSxHQUFHLEdBQUcsQ0FBQztBQUNqQixjQUFRLEdBQUcsR0FBRyxDQUFDO0FBQ2YsU0FBRyxHQUFHLElBQUksS0FBSyxDQUFDLHVCQUFVLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDbEMsYUFBTyxHQUFVLElBQUksS0FBSyxDQUFDLHVCQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzdELGFBQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO0FBb0R2QyxDQUFDIn0=