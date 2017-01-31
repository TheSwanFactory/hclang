import { Context, Frame, FrameArray } from "../frames";
export declare class ParseToken extends Frame {
    protected data: Frame;
    constructor(data: Frame, meta?: Context);
    called_by(context: Frame, parameter: Frame): Frame;
}
export declare class ParsePipe extends FrameArray {
    constructor(out: Frame, meta?: Context);
}
