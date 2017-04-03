import { Context } from "../frames";
import { Lex } from "./lex";
export declare class LexQuote extends Lex {
    protected constructor(factory: any);
    protected isQuoting(): boolean;
}
export declare class LexString extends LexQuote {
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
