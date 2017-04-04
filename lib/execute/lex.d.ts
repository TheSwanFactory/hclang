import { Frame, FrameAtom } from "../frames";
export declare type Flag = {
    [key: string]: boolean;
};
export declare class Token extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class Lex extends Frame {
    protected factory: any;
    protected body: string;
    protected sample: FrameAtom;
    constructor(factory: any);
    call(argument: Frame, parameter?: Frame): Frame;
    getClassName(): string;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected isTerminal(char: string): boolean;
    protected isQuote(): boolean;
    protected finish(argument: Frame, passAlong: boolean): Frame;
    protected exportFrame(): Frame;
    protected makeFrame(): Token;
}
