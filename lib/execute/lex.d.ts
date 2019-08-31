import { Frame, FrameAtom, ISourced } from "../frames";
export declare type Flag = {
    [key: string]: boolean;
};
export declare class Token extends FrameAtom {
    protected data: Frame;
    constructor(data: Frame);
    called_by(callee: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare class Lex extends Frame implements ISourced {
    protected factory: any;
    static isTerminal(char: string): boolean;
    source: string;
    protected body: string;
    protected sample: FrameAtom;
    constructor(factory: any);
    call(argument: Frame, parameter?: Frame): Frame;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected isQuote(): boolean;
    protected finish(argument: Frame, passAlong: boolean): Frame;
    protected exportFrame(): Frame;
    protected makeFrame(): Token;
}
