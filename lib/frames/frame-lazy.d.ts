import { Context, Frame } from "./frame";
import { FrameExpr } from "./frame-expr";
export declare class FrameLazy extends Frame {
    protected data: Frame;
    static readonly LAZY_BEGIN: string;
    static readonly LAZY_END: string;
    constructor(data: Frame, meta?: Context);
    in(context: Frame): Frame;
    call(argument: Frame): FrameExpr;
    toString(): string;
}
