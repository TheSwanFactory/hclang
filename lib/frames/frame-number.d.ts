import { Context, FrameAtom } from "./frame";
export declare class FrameNumber extends FrameAtom {
    static readonly NUMBER_BEGIN: string;
    static readonly NUMBER_END: string;
    protected data: number;
    constructor(source: string, meta?: Context);
    string_prefix(): string;
    string_suffix(): string;
    protected toData(): number;
}
