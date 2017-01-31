import { Frame, FrameArray } from "../frames";
export declare class ParseToken extends Frame {
    protected data: Frame;
    constructor(data: Frame);
    called_by(context: Frame, parameter: Frame): Frame;
}
export declare class ParsePipe extends Frame {
    protected data: FrameArray;
    protected context: Frame;
    constructor(out: Frame);
}
