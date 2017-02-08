import { Frame } from "../frames";
export declare class Lex extends Frame {
    protected body: string;
    apply(argument: Frame, parameter?: Frame): Frame;
    getClassName(): string;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected exportFrame(): Frame;
    protected makeFrame(): Frame;
}
