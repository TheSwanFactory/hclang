import { Frame, FrameAtom } from "./frame";
export declare class FrameSymbol extends FrameAtom {
    protected data: string;
    static for(symbol: string): FrameSymbol;
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    constructor(data: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): Frame;
    called_by(context: Frame): Frame;
    protected toData(): string;
}
