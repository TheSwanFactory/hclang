import { Frame } from "../frames";
export declare type ICurryFunction = (source: Frame, block: Frame) => Frame;
export declare class FrameCurry extends Frame {
    protected Func: ICurryFunction;
    protected Source: Frame;
    constructor(Func: ICurryFunction, Source: Frame);
    apply(argument: Frame, parameter: Frame): Frame;
    toString(): string;
}
