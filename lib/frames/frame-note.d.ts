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
    where: Frame;
    static readonly NOTE_BEGIN = "$";
    static readonly NOTE_END = ";";
    static readonly NOTE_EXTRAS = "++";
    static readonly LABELS: LanguageBinding;
    static test(data: string, source: string, sum: string): FrameNote;
    static key(source: string, where: Frame): FrameNote;
    static type(source: string): FrameNote;
    static index(source: string): FrameNote;
    static pass(source: string, sum: string): FrameNote;
    static fail(source: string, sum: string): FrameNote;
    constructor(data: string, source: string, where?: Frame);
    in(_contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): this;
    string_prefix(): string;
    string_suffix(): string;
    toString(): string;
    isNote(): boolean;
}
