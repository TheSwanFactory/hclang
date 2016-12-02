import { Context, Frame } from "./frame";
export declare class FrameString extends Frame {
    protected data: string;
    static readonly BEGIN_STRING: string;
    static readonly END_STRING: string;
    constructor(data: string, meta?: Context);
    apply(argument: FrameString): this;
    toStringData(): string;
    toString(): string;
}
