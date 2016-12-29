import { Context, Frame } from "./frames";
import { MetaMap } from "./ops/iterators";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare class FrameCurry extends Frame {
    protected _func: ICurryFunction;
    protected _source: Frame;
    constructor(_func: ICurryFunction, _source: Frame);
    apply(argument: Frame, parameter: Frame): Frame;
}
export declare class FrameOps extends Frame {
    constructor(context: Context);
    get(key: string, origin: Frame): Frame;
}
export declare const Ops: FrameOps;
export { MetaMap };
