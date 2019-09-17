import { Frame } from "./frame";
import { Context } from "./meta-frame";
export interface IArrayConstructor {
    new (data: Array<Frame>, meta: Context): Frame;
}
export declare class FrameList extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: Context);
    string_open(): string;
    string_close(): string;
    toStringDataArray(): string[];
    toStringArray(): string[];
    toString(): string;
    asArray(): Array<Frame>;
    size(): number;
    protected array_eval(contexts: Array<Frame>): Array<Frame>;
}
