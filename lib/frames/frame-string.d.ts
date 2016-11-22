import { FrameArray } from "./frame";
export declare class FrameString extends FrameArray {
    static readonly BEGIN: string;
    static readonly END: string;
    constructor(JSstring: string);
    call(argument: FrameString): this;
    toStringData(): string;
    toString(): string;
}
