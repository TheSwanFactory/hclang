import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
import { Context } from "./meta-frame";
export declare class FrameName extends FrameAtom {
    static readonly NAME_BEGIN: string;
    protected data: FrameSymbol;
    constructor(source: string, meta?: Context);
    in(contexts?: Frame[]): FrameSymbol;
    string_prefix(): string;
    canInclude(char: string): boolean;
    protected toData(): FrameSymbol;
}
