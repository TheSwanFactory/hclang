import { FrameQuote } from './frame-atom';
import { Context } from './meta-frame';
export declare class FrameBytes extends FrameQuote {
    static readonly BYTES_BEGIN = "\\";
    static readonly BYTES_END = "\\";
    protected data: Uint8Array;
    protected length: number;
    constructor(values: number[], meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    toStringData(): string;
    protected toData(): string;
}
