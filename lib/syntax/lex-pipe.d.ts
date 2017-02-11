import { Frame, FrameString } from "../frames";
import { ICurryFunction } from "../ops";
export declare const ender: ICurryFunction;
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(): Frame;
}
