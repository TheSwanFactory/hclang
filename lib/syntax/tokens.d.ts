import { Context, FrameSymbol } from "../frames";
import { Lex } from "./lex";
import { ParseToken } from "./parse";
export declare class LexString extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): ParseToken;
}
export declare class LexComment extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): ParseToken;
}
export declare class LexSpace extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare const tokens: Context;
