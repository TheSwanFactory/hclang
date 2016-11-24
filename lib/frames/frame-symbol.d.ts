import { Frame } from "./frame";
export declare class FrameSymbol extends Frame {
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    static for(symbol: string): FrameSymbol;
    protected data: string;
    constructor(symbol: string);
    toString(): string;
}
