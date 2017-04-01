import { Frame, FrameString } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    parser(): ParsePipe;
    push(): Frame;
    pop(): Frame;
    finish(): Frame;
    next(): this;
}
