import { Frame, FrameString, FrameSymbol } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
export declare const ender: ICurryFunction;
export declare class LexPipe extends Lex {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(): Frame;
    protected makeFrame(): FrameSymbol;
}
