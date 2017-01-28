import { Frame, FrameString, FrameSymbol } from "../frames";
export declare class Lex extends Frame {
    static readonly kOUT: string;
    protected body: string;
    call(argument: Frame, parameter?: Frame): Frame;
    getClassName(): string;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected exportFrame(): void;
    protected makeFrame(): Frame;
}
export declare class LexString extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameString;
}
export declare class LexComment extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
export declare class LexSpace extends Lex {
    protected isEnd(char: string): boolean;
    protected makeFrame(): FrameSymbol;
}
