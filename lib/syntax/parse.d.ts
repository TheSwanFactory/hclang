import { Context, Frame, FrameArray } from "../frames";
export declare class ParseToken extends Frame {
    constructor(token: Frame, meta?: Context);
}
export declare class ParsePipe extends FrameArray {
    constructor(out: Frame, meta?: Context);
}
