import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameName extends Frame {
    protected data: FrameSymbol;
    constructor(symbol: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): FrameSymbol;
    called_by(context: Frame): FrameSymbol;
    toStringData(): string;
    toString(): string;
}
