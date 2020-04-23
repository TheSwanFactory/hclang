"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJhbWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZnJhbWVzL2ZyYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDBDQUEyQjtBQUMzQiw2Q0FBb0Q7QUFJcEQsTUFBYSxLQUFNLFNBQVEsc0JBQVM7SUFXbEMsWUFBYSxJQUFJLEdBQUcsdUJBQVUsRUFBRSxLQUFLLEdBQUcsS0FBSyxFQUFFLFNBQVMsR0FBRyxLQUFLO1FBQzlELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNYLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQTtRQUN2QixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQTtRQUNaLElBQUksS0FBSyxFQUFFO1lBQ1QsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO1NBQ3BCO1FBQ0QsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7U0FDdkI7SUFDSCxDQUFDO0lBRU0sV0FBVztRQUNoQixPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUE7SUFDekIsQ0FBQztJQUFBLENBQUM7SUFFSyxZQUFZO1FBQ2pCLE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQTtJQUN2QixDQUFDO0lBQUEsQ0FBQztJQUVLLEVBQUUsQ0FBRSxNQUFjO1FBQ3ZCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQTtJQUNsQixDQUFDO0lBRU0sRUFBRSxDQUFFLFNBQVMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sS0FBSyxDQUFFLFFBQWUsRUFBRSxVQUFpQjtRQUM5QyxPQUFPLFFBQVEsQ0FBQTtJQUNqQixDQUFDO0lBRU0sU0FBUyxDQUFFLE9BQWMsRUFBRSxTQUFnQjtRQUNoRCxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ2hCLE9BQU8sT0FBTyxDQUFBO1NBQ2Y7UUFDRCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFTSxJQUFJLENBQUUsUUFBZSxFQUFFLFNBQVMsR0FBRyxLQUFLLENBQUMsR0FBRztRQUNqRCxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ2hCLE9BQU8sUUFBUSxDQUFBO1NBQ2hCO1FBQ0QsT0FBTyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtJQUM1QyxDQUFDO0lBRU0sUUFBUTtRQUNiLE9BQU8sSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7SUFDdEUsQ0FBQztJQUVNLE9BQU87UUFDWixPQUFPLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDMUIsQ0FBQzs7QUEvREgsc0JBZ0VDO0FBL0R3QixVQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ1osVUFBSSxHQUFHLElBQUksQ0FBQztBQUNaLGdCQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ2pCLGNBQVEsR0FBRyxHQUFHLENBQUM7QUFDZixTQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsdUJBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNsQyxhQUFPLEdBQVUsSUFBSSxLQUFLLENBQUMsdUJBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDN0QsYUFBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7QUF5RHZDLENBQUMifQ==