import { Frame, FrameList } from "./frame";
export declare class FrameArray extends FrameList {
    static readonly BEGIN_ARRAY: string;
    static readonly END_ARRAY: string;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    string_open(): string;
    string_close(): string;
    in(contexts?: Frame[]): Frame;
    at(index: number): Frame;
}
