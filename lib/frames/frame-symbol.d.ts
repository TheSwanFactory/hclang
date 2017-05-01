import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameSymbol extends FrameAtom {
    protected data: string;
    static readonly SYMBOL_REGEX: RegExp;
    static for(symbol: string): FrameSymbol;
    static end(): FrameSymbol;
    protected static symbols: {
        [key: string]: FrameSymbol;
    };
    constructor(data: string, meta?: Context);
    in(contexts?: Frame[]): Frame;
    called_by(context: Frame): Frame;
    canInclude(char: string): boolean;
    protected toData(): string;
}
