import { Frame } from "./frame";
export declare class FrameChar extends Frame {
    protected static chars: {
        [key: string]: FrameChar;
    };
    static for(char: string): FrameChar;
    protected data: string;
    constructor(char: string);
    toStringData(): string;
    toString(): string;
}
