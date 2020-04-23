import { Frame } from './frame';
import { FrameSymbol } from './frame-symbol';
export declare class FrameArg extends FrameSymbol {
    static readonly ARG_CHAR = "_";
    static here(): FrameArg;
    static level(count?: number): FrameArg;
    protected static args: {
        [key: string]: FrameArg;
    };
    protected static _for(symbol: string): FrameArg;
    in(contexts?: Frame[]): Frame;
}
export declare class FrameParam extends FrameSymbol {
    static readonly ARG_CHAR = "^";
    static there(): FrameParam;
    static level(count?: number): FrameParam;
    protected static params: {
        [key: string]: FrameParam;
    };
    protected static _for(symbol: string): FrameParam;
    in(contexts?: Frame[]): Frame;
}
