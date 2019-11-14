import { Frame, ISourced } from "../frames";
import { Token } from "./lex";
export declare class LexBytes extends Frame implements ISourced {
    protected count: number;
    source: string;
    protected body: number[];
    constructor(count: number, up: Frame);
    call(argument: Frame, _parameter?: Frame): Frame;
    protected finish(_argument: Frame, _passAlong: boolean): Frame;
    protected exportFrame(): Frame;
    protected makeFrame(): Token;
}
