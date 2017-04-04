import { Frame, FrameString } from "../frames";
export declare class LexOptions extends Frame {
    protected flags: any;
    constructor(flags: any);
}
export declare class Lexer extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    fold(argument: Frame): void;
    terminate(options: LexOptions): Frame;
}
