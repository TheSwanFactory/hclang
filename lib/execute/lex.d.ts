import { Frame, FrameAtom, ISourced } from '../frames';
import { LexBytes } from './lex-bytes';
import { LexPipe } from './lex-pipe';
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
    protected Factory: any;
    static isTerminal(char: string): boolean;
    source: string;
    pipe: LexPipe;
    protected body: string;
    protected sample: FrameAtom;
    constructor(Factory: any);
    call(argument: Frame, _parameter?: Frame): Frame;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected isQuote(): boolean;
    protected finish(argument: Frame, passAlong: boolean): Frame;
    protected checkRecursive(_argument: Frame): LexBytes;
    protected exportFrame(): Frame;
    protected makeFrame(): Token;
}
