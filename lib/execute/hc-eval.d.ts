import { Context, Frame } from "../frames";
import { LexPipe } from "./lex-pipe";
export interface IProcessEnv {
    [key: string]: string | undefined;
}
export declare class HCEval {
    protected out: Frame;
    static make_context(env: IProcessEnv): Context;
    static make_pipe(out: Frame): LexPipe;
    current: Frame;
    constructor(out: Frame);
    call(input: string): void;
}
