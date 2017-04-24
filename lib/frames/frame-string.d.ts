import { Context, Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
export declare class FrameString extends FrameQuote {
    protected data: string;
    static readonly STRING_BEGIN: string;
    static readonly STRING_END: string;
    constructor(data: string, meta?: Context);
    apply(argument: FrameString): FrameString;
    string_prefix(): string;
    string_suffix(): string;
    reduce(iteratee: Frame): Frame;
    protected toData(): string;
}
