import {
    type Context,
    Frame,
    FrameArray,
    FrameBind,
    FrameExpr,
    type IArrayConstructor,
} from "../frames.ts";
import { type IFinish, Terminal } from "./terminals.ts";

export class ParsePipe extends FrameArray implements IFinish {
    public collector: Array<Frame>;
    protected Factory: IArrayConstructor;

    constructor(out: Frame, factory: IArrayConstructor) {
        const meta: Context = {};
        meta[ParsePipe.kOUT] = out;
        meta[Frame.kEND] = Terminal.end();
        super([], meta);
        this.Factory = factory;
        this.collector = [];
    }

    public next(statement: boolean = false): ParsePipe {
        if (this.length() === 0) {
            return this;
        }
        const term = this.asArray();
        const expr = new FrameExpr(term);
        if (statement) {
            expr.is.statement = true;
        }
        this.collector.push(expr);
        this.reset();
        return this;
    }

    public bind(_Factory: IArrayConstructor | undefined = undefined): ParsePipe {
        return this.push(FrameBind);
    }

    public unbind(): ParsePipe {
        let next = this as ParsePipe;
        while (next.Factory === FrameBind) {
            next = next.pop(FrameBind);
        }
        return next;
    }

    public push(Factory: IArrayConstructor): ParsePipe {
        const child = new ParsePipe(this, Factory);
        return child;
    }

    public pop(_Factory: IArrayConstructor): ParsePipe {
        const parent = this.get(ParsePipe.kOUT) as ParsePipe;
        this.finish(Frame.nil);
        return parent;
    }

    public canPop(Factory: IArrayConstructor): boolean {
        const match = this.Factory.name === Factory.name;
        if (!match) {
            console.error(
                `ParsePipe.canPop.failed: ${Factory.name} cannot pop ${this.Factory.name}`,
            );
        }
        return match;
    }

    public finish(terminal: Frame): Frame {
        this.next();
        const out = this.get(Frame.kOUT);
        const value = this.makeFrame();
        if (value instanceof FrameBind && value.isEmpty()) {
            return out;
        }
        const result = out.call(value);
        out.call(terminal);
        return result;
    }

    protected makeFrame(): Frame {
        const group = new this.Factory(this.collector, {});
        this.collector = [];
        return group;
    }
}
