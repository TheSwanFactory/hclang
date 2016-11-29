import { Frame } from "./frame";
export declare class FrameSymbol extends Frame {
    protected data: string;
    static readonly underbar: string;
    static for(symbol: string): FrameSymbol;
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    constructor(data: string, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): Frame;
    called_by(context: Frame): Frame;
    toString(): string;
}
