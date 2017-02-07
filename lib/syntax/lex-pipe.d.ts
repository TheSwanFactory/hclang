import { Frame, FrameString } from "../frames";
import { Lex } from "./lex";
export declare class LexPipe extends Lex {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(): Frame;
}
