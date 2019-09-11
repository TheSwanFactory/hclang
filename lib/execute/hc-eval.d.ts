import { Context, Frame } from "../frames";
import { LexPipe } from "./lex-pipe";
export interface IProcessEnv {
    [key: string]: string | undefined;
}
export declare class HCEval {
    protected out: Frame;
    static readonly SOURCE = "; ";
    static readonly EXPECT = "# ";
    static readonly ACTUAL = "# ";
    static make_context(env: IProcessEnv): Context;
    static make_pipe(out: Frame): LexPipe;
    protected lexer: Frame;
    constructor(out: Frame);
    call(input: string): Frame;
    call_file(file: string): Frame;
    repl(): boolean;
    protected checkInput(input: string): void;
}
