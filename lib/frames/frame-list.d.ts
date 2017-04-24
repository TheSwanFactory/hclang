import { Context, Frame } from "./frame";
export interface IArrayConstructor {
    new (data: Array<Frame>, meta: Context): Frame;
}
export declare class FrameList extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: Context);
    toStringDataArray(): string[];
    toStringArray(): string[];
    toString(): string;
    asArray(): Array<Frame>;
    size(): number;
    protected array_eval(contexts: Array<Frame>): Frame;
}
