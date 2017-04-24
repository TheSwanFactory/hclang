import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
export declare class FrameSymbol extends FrameAtom {
    protected data: string;
    static for(symbol: string): FrameSymbol;
    static end(): FrameSymbol;
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    constructor(data: string, meta?: {
        [key: string]: Frame;
    });
    in(contexts?: Frame[]): Frame;
    called_by(context: Frame): Frame;
    protected toData(): string;
}
