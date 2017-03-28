import { Frame } from "../frames";
export declare class Lex extends Frame {
    protected body: string;
    protected pass_on: boolean;
    call(argument: Frame, parameter?: Frame): Frame;
    getClassName(): string;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected isTerminal(char: string): boolean;
    protected isQuoting(): boolean;
    protected finish(argument: Frame, pass: boolean): Frame;
    protected exportFrame(): Frame;
    protected makeFrame(): Frame;
}
