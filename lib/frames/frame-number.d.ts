import { Context } from "./frame";
import { FrameAtom } from "./frame-atom";
export declare class FrameNumber extends FrameAtom {
    static readonly NUMBER_BEGIN: string;
    static readonly NUMBER_END: string;
    protected data: number;
    constructor(source: string, meta?: Context);
    protected toData(): number;
}
