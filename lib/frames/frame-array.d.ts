import { Frame } from "./frame";
export declare class FrameArray extends Frame {
    data: Array<Frame>;
    static readonly BEGIN_ARRAY: string;
    static readonly END_ARRAY: string;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    group_begin(): string;
    group_end(): string;
    in(context?: Frame): Frame;
    at(index: number): Frame;
    toStringData(): string;
}
