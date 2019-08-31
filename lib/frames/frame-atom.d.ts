import { Frame } from "./frame";
import { Context } from "./meta-frame";
export interface IStringConstructor {
    new (data: string, meta: Context): FrameAtom;
}
export declare class FrameAtom extends Frame {
    constructor(meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    string_start(): string;
    toStringData(): string;
    toString(): string;
    canInclude(char: string): boolean;
    protected toData(): any;
}
export declare class FrameQuote extends FrameAtom {
}
