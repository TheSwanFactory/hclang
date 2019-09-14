import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameString extends FrameQuote {
    protected data: string;
    static readonly STRING_BEGIN = "\u201C";
    static readonly STRING_END = "\u201D";
    constructor(data: string, meta?: Context);
    apply(argument: FrameString): FrameString;
    string_prefix(): string;
    string_suffix(): string;
    reduce(starter: Frame): Frame;
    protected toData(): string;
}
