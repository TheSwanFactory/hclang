import { FrameQuote } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameComment extends FrameQuote {
    protected data: string;
    static readonly COMMENT_BEGIN: string;
    static readonly COMMENT_END: string;
    static readonly COMMENT_EOL: string;
    constructor(data: string, meta?: Context);
    isVoid(): boolean;
    string_prefix(): string;
    string_suffix(): string;
    canInclude(char: string): boolean;
    protected toData(): string;
}
