import { Context, FrameString, FrameSymbol } from "../frames";
import { Lex } from "./lex";
export declare class LexString extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameString;
}
export declare class LexComment extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare class LexSpace extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare const tokens: Context;
