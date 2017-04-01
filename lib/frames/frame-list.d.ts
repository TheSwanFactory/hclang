import { Frame } from "./frame";
export declare class FrameList extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    toStringDataArray(): string[];
    toStringArray(): string[];
    toString(): string;
    asArray(): Array<Frame>;
}
