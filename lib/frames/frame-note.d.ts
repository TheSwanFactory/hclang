import { Frame } from "./frame";
import { FrameQuote } from "./frame-atom";
export declare type Binding = {
    [key: string]: string;
};
export declare type LanguageBinding = {
    [key: string]: Binding;
};
export declare class FrameNote extends FrameQuote {
    protected data: string;
    static readonly NOTE_BEGIN = "$";
    static readonly NOTE_END = ";";
    static readonly LABELS: LanguageBinding;
    static test(data: string, source: string, sum: string): FrameNote;
    static key(source: string): FrameNote;
    static type(source: string): FrameNote;
    static index(source: string): FrameNote;
    static pass(source: string, sum: string): FrameNote;
    static fail(source: string, sum: string): FrameNote;
    constructor(data: string, source: string, meta?: import("./meta-frame").Context);
    in(_contexts?: Frame[]): this;
    string_prefix(): string;
    string_suffix(): string;
    toString(): string;
    isNote(): boolean;
}
