import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameArg extends FrameSymbol {
    static here(): FrameArg;
    static level(count?: number): FrameArg;
    protected static args: {
        [key: string]: FrameArg;
    };
    protected static _for(symbol: string): FrameArg;
    private static readonly underbar;
    protected constructor(data: string);
    in(context: Frame): Frame;
}
