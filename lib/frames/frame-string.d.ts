import { FrameArray } from "./frame";
export declare class FrameString extends FrameArray {
    static readonly BEGIN: string;
    static readonly END: string;
    constructor(JSstring: string);
    toStringData(): void;
    toString(): string;
}
