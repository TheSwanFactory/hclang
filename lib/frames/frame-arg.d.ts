import { Frame } from "./frame";
import { FrameSymbol } from "./frame-symbol";
export declare class FrameArg extends FrameSymbol {
    static for(symbol: string): FrameArg;
    static here(): FrameArg;
    static level(number?: number): FrameArg;
    protected static args: {
        [key: string]: FrameArg;
    };
    protected constructor(data: string);
    in(context: Frame): Frame;
}
