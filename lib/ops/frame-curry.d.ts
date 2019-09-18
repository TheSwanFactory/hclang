import { Frame } from "../frames";
export declare type ICurryFunction = (source: Frame, block: Frame) => Frame;
export declare class FrameCurry extends Frame {
    protected Func: ICurryFunction;
    protected Source: Frame;
    protected key: string;
    constructor(Func: ICurryFunction, Source: Frame, key: string);
    apply(argument: Frame, _parameter: Frame): Frame;
    toString(): string;
}
