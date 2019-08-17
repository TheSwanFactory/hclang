import { Context, Frame, FrameArray } from "../frames";
import { LexPipe } from "./lex-pipe";
export interface IProcessEnv {
    [key: string]: string | undefined;
}
export declare class HC extends FrameArray {
    static make_context(env?: IProcessEnv): Context;
    static from_env(env?: IProcessEnv): HC;
    result: FrameArray;
    lexer: LexPipe;
    constructor(context?: Context);
    evaluate(input: string): Frame;
}
