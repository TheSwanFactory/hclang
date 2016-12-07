import { Context, Frame } from "./frame";
export declare class FrameLazy extends Frame {
    protected data: Frame;
    static readonly BEGIN_LAZY: string;
    static readonly END_LAZY: string;
    constructor(data: Frame, meta?: Context);
    in(context: Frame): Frame;
    toString(): string;
}
