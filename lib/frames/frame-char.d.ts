import { Frame } from "./frame";
export declare class FrameChar extends Frame {
    protected data: string;
    constructor(char: string);
    toChar(): string;
    toString(): string;
}