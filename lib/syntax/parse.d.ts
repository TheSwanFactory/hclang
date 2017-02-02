import { Frame, FrameArray, FrameAtom } from "../frames";
import { ICurryFunction } from "../ops";
export declare class ParseToken extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class ParseTerminal extends Frame {
    protected data: ICurryFunction;
    constructor(data: ICurryFunction);
    called_by(callee: Frame, parameter: Frame): any;
    protected toData(): any;
}
export declare class ParsePipe extends Frame {
    protected data: FrameArray;
    constructor(out: Frame);
}
