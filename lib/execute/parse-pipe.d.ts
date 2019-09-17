import { Frame, FrameArray } from "../frames";
import { IFinish } from "./terminals";
export declare class ParsePipe extends FrameArray implements IFinish {
    collector: Array<Frame>;
    protected factory: any;
    constructor(out: Frame, factory: any);
    next(statement?: boolean): Frame;
    push(factory: any): Frame;
    pop(factory: any): Frame;
    finish(terminal: any): Frame;
    protected makeFrame(): any;
}
