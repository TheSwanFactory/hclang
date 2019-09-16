import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameName extends FrameAtom {
    static readonly NAME_BEGIN = ".";
    protected data: FrameSymbol;
    constructor(source: string, meta?: import("./meta-frame").Context);
    in(contexts?: Frame[]): Frame;
    string_prefix(): string;
    canInclude(char: string): boolean;
    protected toData(): FrameSymbol;
}
