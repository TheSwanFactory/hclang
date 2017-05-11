import { Context, Frame, FrameString } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(): Frame;
    parser(): ParsePipe;
    perform(actions: Context): this;
    next(parameter: Frame): this;
    push(parameter: Frame): Frame;
    pop(parameter: Frame): Frame;
}
