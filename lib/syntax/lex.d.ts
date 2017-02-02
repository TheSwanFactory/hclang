import { Frame } from "../frames";
export declare class Lex extends Frame {
    protected body: string;
    call(argument: Frame, parameter?: Frame): Frame;
    getClassName(): string;
    toString(): string;
    protected isEnd(char: string): boolean;
    protected exportFrame(): void;
    protected makeFrame(): Frame;
}
