import { Context, FrameAtom } from "./frame";
export declare class FrameString extends FrameAtom {
    protected data: string;
    static readonly STRING_BEGIN: string;
    static readonly STRING_END: string;
    constructor(data: string, meta?: Context);
    apply(argument: FrameString): FrameString;
    string_prefix(): string;
    string_suffix(): string;
    protected toData(): string;
}
