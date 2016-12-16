import { Frame, FrameList } from "./frame";
export declare class FrameArray extends FrameList {
    static readonly BEGIN_ARRAY: string;
    static readonly END_ARRAY: string;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    group_begin(): string;
    group_end(): string;
    in(context?: Frame): Frame;
    at(index: number): Frame;
}
