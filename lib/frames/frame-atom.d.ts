import { Frame } from "./frame";
export declare class FrameAtom extends Frame {
    constructor(meta?: {
        [key: string]: Frame;
    });
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
