import { Context, Frame, FrameSymbol } from "../frames";
import { ICurryFunction } from "../ops";
import { Lex } from "./lex";
export declare class LexTerminal extends Frame {
    protected data: ICurryFunction;
    constructor(data: ICurryFunction);
    apply(argument: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class LexSpace extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare const terminals: Context;
