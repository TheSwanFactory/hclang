import { Frame } from "./frame.ts";
import { FrameList } from "./frame-list.ts";
import { NilContext } from "./meta-frame.ts";

export class FrameExpr extends FrameList {
    constructor(data: Array<Frame>, meta = NilContext) {
        super(data, meta);
        data.forEach((item) => {
            item.up = this;
        });
    }

    public override in(contexts = [Frame.nil]): Frame {
        contexts.push(this);
        const result = this.data.reduce((sum: Frame, item: Frame): Frame => {
            const value = item.in(contexts);
            const next_sum = sum.call(value);
            return next_sum;
        }, Frame.nil);

        if (this.is.statement) {
            this.data = [result];
            return this;
        }
        return result;
    }

    public override call(argument: Frame, parameter = Frame.nil): Frame {
        return this.in([argument, parameter]);
    }

    public override toStringDataArray(): string[] {
        const array = this.data.map((obj: Frame): string => obj.toString());
        return [array.join(" ") + ","];
    }
}

export class FrameBind extends FrameExpr {
}
