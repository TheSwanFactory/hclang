import { Frame } from "./frames";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare type FuncDict = {
    [key: string]: ICurryFunction;
};
export declare class FrameOps extends Frame {
    protected OpsDict: FuncDict;
    constructor(OpsDict: FuncDict);
    get_here(key: string, origin: Frame): Frame;
    protected curry(func: ICurryFunction, origin: Frame): Frame;
}
export declare const Ops: FrameOps;
