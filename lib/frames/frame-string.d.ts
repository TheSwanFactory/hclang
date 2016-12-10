import { Context, Frame } from "./frame";
export declare class FrameString extends Frame {
    protected data: string;
    static readonly STRING_BEGIN: string;
    static readonly STRING_END: string;
    constructor(data: string, meta?: Context);
    apply(argument: FrameString): this;
    toStringData(): string;
    toString(): string;
}
