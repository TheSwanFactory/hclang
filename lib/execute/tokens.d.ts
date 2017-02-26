import { Context, Frame, FrameAtom } from "../frames";
import { Lex } from "./lex";
export declare class ParseToken extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class LexString extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): ParseToken;
}
export declare class LexComment extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): ParseToken;
}
export declare const tokens: Context;
