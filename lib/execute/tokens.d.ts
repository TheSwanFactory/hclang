import { Context, Frame, FrameAtom } from "../frames";
import { Lex } from "./lex";
export declare class Token extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class LexQuote extends Lex {
    protected constructor(factory: any);
    protected isQuoting(): boolean;
}
export declare class LexString extends LexQuote {
    constructor();
    protected isEnd(char: string): boolean;
    protected makeFrame(): Token;
}
export declare class LexComment extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
    protected makeFrame(): Token;
}
export declare class LexSpace extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
    protected makeFrame(): Frame;
}
export declare const tokens: Context;
