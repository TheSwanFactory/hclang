import { Frame } from "./frame";
export declare class FrameChar extends Frame {
    protected data: string;
    static for(char: string): FrameChar;
    constructor(char: string);
    toStringData(): string;
    toString(): string;
}
