import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export { FrameNote } from "./frame-note";
export declare class FrameArg extends FrameSymbol {
    static readonly ARG_CHAR: string;
    static here(): FrameArg;
    static level(count?: number): FrameArg;
    protected static args: {
        [key: string]: FrameArg;
    };
    protected static _for(symbol: string): FrameArg;
    protected constructor(data: string);
    in(contexts?: Frame[]): Frame;
}
export declare class FrameParam extends FrameSymbol {
    static readonly ARG_CHAR: string;
    static there(): FrameParam;
    static level(count?: number): FrameParam;
    protected static params: {
        [key: string]: FrameParam;
    };
    protected static _for(symbol: string): FrameParam;
    protected constructor(data: string);
    in(contexts?: Frame[]): Frame;
}
