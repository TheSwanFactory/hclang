import { FrameAtom } from "./frame-atom";
import { Context } from "./meta-frame";
export declare class FrameNumber extends FrameAtom {
    static readonly NUMBER_BEGIN = "0-9";
    static readonly NUMBER_END = "^0-9";
    protected data: number;
    string_start(): string;
    constructor(source: string, meta?: Context);
    protected toData(): number;
}
