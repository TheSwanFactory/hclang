import { FrameAtom } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameNumber extends FrameAtom {
    static readonly NUMBER_BEGIN: string;
    static readonly NUMBER_END: string;
    protected data: number;
    constructor(source: string, meta?: Context);
    protected toData(): number;
}
