import { Frame } from "./frame";
export declare class FrameSymbol extends Frame {
    protected data: string;
    static for(symbol: string): FrameSymbol;
    static here(): FrameSymbol;
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    private static readonly underbar;
    constructor(data: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): Frame;
    called_by(context: Frame): Frame;
    toString(): string;
}
