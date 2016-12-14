import { Frame } from "./frame";
export declare class FrameArray extends Frame {
    data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): Frame;
    at(index: number): Frame;
    toStringData(): string;
}
