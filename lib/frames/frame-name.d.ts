import { Frame, FrameAtom } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameName extends FrameAtom {
    static readonly NAME_BEGIN: string;
    protected data: FrameSymbol;
    constructor(symbol: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): FrameSymbol;
    string_prefix(): string;
    protected toData(): FrameSymbol;
}
