import { Context } from "../frames";
import { Lex } from "./lex";
export declare class LexString extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
}
export declare class LexComment extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
}
export declare class LexSpace extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
}
export declare const tokens: Context;
