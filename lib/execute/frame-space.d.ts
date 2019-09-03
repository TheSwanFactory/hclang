import * as frame from "../frames";
export declare class FrameSpace extends frame.FrameAtom {
    static readonly SPACE_CHAR = " ";
    constructor(meta?: frame.Context);
    string_start(): string;
    canInclude(char: string): boolean;
}
