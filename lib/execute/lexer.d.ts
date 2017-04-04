import { Frame, FrameString } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class Lexer extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    parser(): ParsePipe;
    finish(): Frame;
    next(): this;
}
