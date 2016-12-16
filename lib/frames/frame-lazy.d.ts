import { Context, Frame, FrameList } from "./frame";
import { FrameExpr } from "./frame-expr";
export declare class FrameLazy extends FrameList {
    static readonly LAZY_BEGIN: string;
    static readonly LAZY_END: string;
    constructor(data: Array<Frame>, meta?: Context);
    string_open(): string;
    string_close(): string;
    in(context: Frame): Frame;
    call(argument: Frame): FrameExpr;
}
