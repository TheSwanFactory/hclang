import { Frame, FrameArray, FrameAtom } from "../frames";
import { ICurryFunction } from "../ops";
export declare const ender: ICurryFunction;
export declare class ParsePipe extends FrameArray {
    constructor(out: Frame);
    finish(): Frame;
}
export declare class ParseToken extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
