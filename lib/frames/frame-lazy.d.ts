import { Context, Frame } from "./frame";
export declare class FrameLazy extends Frame {
    protected data: Frame;
    static readonly LAZY_BEGIN: string;
    static readonly LAZY_END: string;
    constructor(data: Frame, meta?: Context);
    in(context: Frame): Frame;
    toString(): string;
}
