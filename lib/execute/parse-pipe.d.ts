import { Frame, FrameArray, FrameExpr } from "../frames";
export declare class ParsePipe extends FrameArray {
    constructor(out: Frame);
    push(argument: Frame): Frame;
    pop(argument: Frame): Frame;
    finish(argument: Frame): Frame;
    protected makeFrame(): FrameExpr;
}
