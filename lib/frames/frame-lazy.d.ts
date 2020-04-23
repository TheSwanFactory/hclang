import { Frame } from './frame';
import { FrameExpr } from './frame-expr';
import { Context } from './meta-frame';
export declare class FrameLazy extends FrameExpr {
    static readonly LAZY_BEGIN = "{";
    static readonly LAZY_END = "}";
    constructor(data: Array<Frame>, meta?: Context);
    string_open(): string;
    string_close(): string;
    in(contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): FrameExpr;
    protected meta_for(context: Frame): Context;
}
