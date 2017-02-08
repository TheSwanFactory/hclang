import { Context, FrameSymbol } from "../frames";
import { Lex } from "./lex";
export declare class LexSpace extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare const terminals: Context;
