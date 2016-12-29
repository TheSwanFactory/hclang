import { Context, Frame } from "./frames";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare class FrameCurry extends Frame {
    protected Func: ICurryFunction;
    protected Source: Frame;
    constructor(Func: ICurryFunction, Source: Frame);
    apply(argument: Frame, parameter: Frame): Frame;
}
export declare class FrameOps extends Frame {
    constructor(context: Context);
    get(key: string, origin: Frame): Frame;
}
export declare const Ops: FrameOps;
