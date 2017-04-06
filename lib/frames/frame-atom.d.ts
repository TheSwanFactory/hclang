import { Frame } from "./frame";
export declare class FrameAtom extends Frame {
    protected source: string;
    constructor(source: string, meta?: {
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
