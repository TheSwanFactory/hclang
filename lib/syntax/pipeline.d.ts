<<<<<<< HEAD
import { Context, Frame, FrameString } from "../frames";
export declare class LexParse extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
=======
import { Context, Frame } from "../frames";
export declare class EvalPipe extends Frame {
    constructor(out: Frame, meta?: Context);
>>>>>>> master
}
export declare const framify: (input: string, context?: Context) => Frame;
