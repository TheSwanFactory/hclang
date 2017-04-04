import * as frame from "../frames";
import { Lex } from "./lex";
export declare class FrameSpace extends frame.Frame {
    canInclude(char: string): boolean;
}
export declare class LexSpace extends Lex {
    constructor();
    protected isEnd(char: string): boolean;
}
export declare const syntax: frame.Context;
