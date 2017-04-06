import { Frame, FrameArray, FrameExpr } from "../frames";
export declare class Parser extends FrameArray {
    constructor(out: Frame);
    push(): Frame;
    pop(): Frame;
    finish(): Frame;
    protected makeFrame(): FrameExpr;
}
