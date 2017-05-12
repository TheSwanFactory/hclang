import { Context, Frame, FrameString } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    parser(): ParsePipe;
    finish(argument: Frame): Frame;
    perform(actions: Context): this;
    next(argument: Frame): this;
    push(argument: Frame): Frame;
    pop(argument: Frame): Frame;
}
