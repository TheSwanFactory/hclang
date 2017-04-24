import { Context } from "./frame";
import { FrameQuote } from "./frame-atom";
export declare class FrameComment extends FrameQuote {
    protected data: string;
    static readonly COMMENT_BEGIN: string;
    static readonly COMMENT_END: string;
    constructor(data: string, meta?: Context);
    isVoid(): boolean;
    string_prefix(): string;
    string_suffix(): string;
    protected toData(): string;
}
