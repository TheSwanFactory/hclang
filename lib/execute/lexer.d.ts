import { Frame, FrameString } from "../frames";
export declare class Lexer extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    fold(argument: Frame): void;
    terminate(parameter: Frame): Frame;
}
