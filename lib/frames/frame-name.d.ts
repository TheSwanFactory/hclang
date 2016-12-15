import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameName extends Frame {
    static readonly NAME_BEGIN: string;
    protected data: FrameSymbol;
    constructor(symbol: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): FrameSymbol;
    toStringData(): string;
}
