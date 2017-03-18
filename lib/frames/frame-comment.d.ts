import { Context, FrameAtom } from "./frame";
export declare class FrameComment extends FrameAtom {
    protected data: string;
    static readonly COMMENT_BEGIN: string;
    static readonly COMMENT_END: string;
    constructor(data: string, meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    protected toData(): string;
}
