import { Context, Frame, FrameString } from "../frames";
export declare class LexPipe extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(argument: Frame): Frame;
    perform(actions: Context): this;
}
