import { Frame, FrameString, FrameSymbol } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
export declare const ender: ICurryFunction;
export declare class LexTerminal extends Frame {
    protected data: ICurryFunction;
    constructor(data: ICurryFunction);
    apply(argument: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class LexPipe extends Lex {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(): Frame;
    protected makeFrame(): FrameSymbol;
}
