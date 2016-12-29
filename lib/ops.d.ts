import { Context, Frame } from "./frames";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare const Curry: (func: ICurryFunction, source: Frame) => (block: Frame) => Frame;
import { MetaMap } from "./ops/iterators";
export declare class FrameCurry extends Frame {
    constructor(func: ICurryFunction);
}
export declare class FrameOps extends Frame {
    constructor(context: Context);
    get(key: string, origin: Frame): Frame;
}
export declare const Ops: FrameOps;
export { MetaMap };
