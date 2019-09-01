import { Context, Frame, FrameArray } from "../frames";
import { LexPipe } from "./lex-pipe";
export interface IProcessEnv {
    [key: string]: string | undefined;
}
export declare class HCLang extends FrameArray {
    static make_context(env: IProcessEnv): Context;
    static make_pipe(dest: FrameArray): LexPipe;
    result: FrameArray;
    lexer: LexPipe;
    constructor(env?: IProcessEnv);
    evaluate(input: string): Frame;
    exec_file(file: string): Frame;
}
