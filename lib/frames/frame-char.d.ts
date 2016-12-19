import { FrameAtom } from "./frame";
export declare class FrameChar extends FrameAtom {
    protected data: string;
    static readonly CHAR_BEGIN: string;
    static for(char: string): FrameChar;
    protected static chars: {
        [key: string]: FrameChar;
    };
    constructor(data: string);
    string_prefix(): string;
    protected toData(): string;
}
