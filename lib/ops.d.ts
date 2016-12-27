import { Frame } from "./frames";
export interface ICurryFunction extends Function {
    (source: Frame, block: Frame): Frame;
}
export declare const Curry: (func: ICurryFunction, source: Frame) => (block: Frame) => Frame;
export { MetaMap } from "./ops/iterators";
