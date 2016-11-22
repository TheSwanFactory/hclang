import { Frame, FrameArray } from "./frame";
export declare class FrameExpr extends FrameArray {
    static readonly BEGIN: string;
    static readonly END: string;
    constructor(data: Array<Frame>);
    call(argument: Frame): this;
    toStringData(): string;
    toString(): string;
}
