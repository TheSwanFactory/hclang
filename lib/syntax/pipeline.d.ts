import { Context, Frame, FrameString } from "../frames";
export declare class LexParse extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
}
export declare const framify: (input: string, context?: Context) => Frame;
