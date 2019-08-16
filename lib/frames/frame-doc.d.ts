import { FrameString } from "./frame-string";
import { Context } from "./meta-frame";
export declare class FrameDoc extends FrameString {
    static readonly DOC_BEGIN = "`";
    static readonly DOC_END = "`";
    constructor(data: string, meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
}
