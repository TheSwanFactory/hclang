import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameName extends FrameAtom {
    static readonly NAME_BEGIN: string;
    protected data: FrameSymbol;
    constructor(source: string, meta?: {
        [key: string]: Frame;
    });
    in(contexts?: Frame[]): FrameSymbol;
    string_prefix(): string;
    protected toData(): FrameSymbol;
}
