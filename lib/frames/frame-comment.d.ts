import { FrameAtom } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameComment extends FrameAtom {
    protected data: string;
    static readonly COMMENT_BEGIN = "#";
    static readonly COMMENT_END = "#";
    static readonly COMMENT_EOL = "\n";
    static readonly COMMENT_END_REGEX: RegExp;
    constructor(data: string, meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    canInclude(char: string): boolean;
    protected toData(): string;
}
