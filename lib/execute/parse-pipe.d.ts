import { Frame, FrameArray, FrameExpr } from "../frames";
export declare class ParsePipe extends FrameArray {
    constructor(out: Frame);
    push(): Frame;
    pop(): Frame;
    finish(): Frame;
    protected makeFrame(): FrameExpr;
}
