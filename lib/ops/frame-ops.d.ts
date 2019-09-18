import { Frame } from "../frames";
import { ICurryFunction } from "./frame-curry";
export declare type FuncDict = {
    [key: string]: ICurryFunction;
};
export declare class FrameOps extends Frame {
    protected OpsDict: FuncDict;
    constructor(OpsDict: FuncDict);
    get(key: string, origin: Frame): Frame;
    toString(): string;
    protected curry(func: ICurryFunction, origin: Frame, key: string): Frame;
}
