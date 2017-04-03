import { Frame, FrameAtom } from "../frames";
export declare class Token extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class Lex extends Frame {
    protected factory: any;
    protected isQuote: boolean;
    protected body: string;
    protected pass_on: boolean;
    protected constructor(factory: any, isQuote?: boolean);
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
