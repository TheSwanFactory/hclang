import { Context, FrameAtom } from "./frame";
export declare class FrameNumber extends FrameAtom {
    protected data: string;
    static readonly NUMBER_BEGIN: string;
    static readonly NUMBER_END: string;
    constructor(data: string, meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    protected toData(): string;
}
