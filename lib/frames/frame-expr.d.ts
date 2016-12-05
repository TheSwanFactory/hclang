import { Frame, FrameArray } from "./frame";
export declare class FrameExpr extends FrameArray {
    static readonly BEGIN: string;
    static readonly END: string;
    constructor(data: Array<Frame>);
    in(context?: Frame): Frame;
    toStringData(): string;
    toString(): string;
}
