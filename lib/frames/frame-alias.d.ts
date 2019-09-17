import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameAlias extends FrameAtom {
    static readonly ALIAS_BEGIN = "@";
    protected data: FrameSymbol;
    constructor(source: string, meta?: import("./meta-frame").Context);
    in(contexts?: Frame[]): Frame;
    string_prefix(): string;
    canInclude(char: string): boolean;
    protected toData(): FrameSymbol;
    protected find(context: Frame, key: string): Frame;
}
