import { FrameAtom } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameNumber extends FrameAtom {
    static readonly NUMBER_CHAR: RegExp;
    static for(digits: string): FrameNumber;
    protected static numbers: {
        [key: string]: FrameNumber;
    };
    protected data: number;
    constructor(source: string, meta?: Context);
    string_start(): string;
    canInclude(char: string): boolean;
    protected toData(): number;
}
