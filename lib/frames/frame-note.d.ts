import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
import { Context } from "./meta-frame";
export declare type Binding = {
    [key: string]: string;
};
export declare type LanguageBinding = {
    [key: string]: Binding;
};
export declare class FrameNote extends FrameQuote {
    protected data: string;
    static readonly NOTE_BEGIN: string;
    static readonly NOTE_END: string;
    static readonly MISSING: string;
    static readonly MISMATCH: string;
    static readonly LABELS: LanguageBinding;
    constructor(data: string, source: string, meta?: Context);
    in(contexts?: Frame[]): this;
    string_prefix(): string;
    string_suffix(): string;
    toString(): string;
    protected toData(): string;
}
