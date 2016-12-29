import { Context, Frame } from "./frames";
import { MetaMap } from "./ops/iterators";
export declare class FrameOps extends Frame {
    constructor(context: Context);
    get(key: string, origin: Frame): Frame;
}
export declare const Ops: FrameOps;
export { MetaMap };
