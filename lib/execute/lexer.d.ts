import { Frame, FrameString } from "../frames";
export declare type LexOptions = {
    [key: string]: any;
};
export declare class FrameStatement {
}
export declare class Lexer extends Frame {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    fold(argument: Frame): void;
    finish(options: LexOptions): Frame;
}
