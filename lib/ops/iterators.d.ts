import { Frame, FrameArray, FrameExpr } from "../frames";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare const Curry: (func: ICurryFunction, source: Frame) => (block: Frame) => Frame;
export declare class FrameCurry extends Frame {
    constructor(func: ICurryFunction);
}
export declare const MetaMap: (source: Frame, block: Frame) => FrameArray;
export declare const MetaMapExpr: (source: Frame) => FrameExpr;
