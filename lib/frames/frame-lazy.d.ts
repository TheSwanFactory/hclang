import { Context, Frame } from "./frame";
import { FrameExpr } from "./frame-expr";
export declare class FrameLazy extends FrameExpr {
    static readonly LAZY_BEGIN: string;
    static readonly LAZY_END: string;
    constructor(data: Array<Frame>, meta?: Context);
    string_open(): string;
    string_close(): string;
    in(contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): FrameExpr;
    protected meta_for(context: Frame): {
        [key: string]: Frame;
    };
}
