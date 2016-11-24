import { Frame } from "./frame";
export declare class FrameChar extends Frame {
    protected data: string;
    static for(char: string): FrameChar;
    protected static chars: {
        [key: string]: FrameChar;
    };
    constructor(data: string);
    toStringData(): string;
    toString(): string;
}
