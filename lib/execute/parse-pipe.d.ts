import { Frame, FrameArray } from "../frames";
export declare class ParsePipe extends FrameArray {
    protected factory: any;
    constructor(out: Frame);
    push(argument: Frame): Frame;
    pop(argument: Frame): Frame;
    finish(argument: Frame): Frame;
    protected makeFrame(): any;
}
