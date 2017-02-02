import { Context, Frame, FrameString } from "../frames";
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
}
export declare class EvalPipe extends Frame {
    constructor(out: Frame, meta?: Context);
}
export declare class ParsePipe extends Frame {
    constructor(out: Frame, meta?: Context);
}
export declare const framify: (input: string, context?: Context) => Frame;
export declare const framify_new: (input: string, context?: Context) => Frame;
