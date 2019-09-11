import { Frame, FrameNote } from "../frames";
export declare type Counts = {
    [key: string]: number;
};
export declare class HCTest extends Frame {
    protected out: Frame;
    n: Counts;
    protected actual: Frame;
    constructor(out: Frame);
    apply(argument: Frame, parameter?: Frame): Frame;
    performTest(expected: Frame, actual: Frame, source: Frame): FrameNote;
    assertEqual(expected: string, actual: string, source: string): FrameNote;
}
