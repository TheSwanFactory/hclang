import { Frame, FrameArray } from "../frames";
export declare class ParsePipe extends FrameArray {
    protected factory: any;
    protected collector: Array<Frame>;
    constructor(out: Frame, factory: any);
    next(header: boolean): Frame;
    push(factory: any): Frame;
    pop(factory: any): Frame;
    finish(terminal: any): Frame;
    protected makeFrame(): any;
}
