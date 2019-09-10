import { Frame } from "../frames";
export declare type Counts = {
    [key: string]: number;
};
export declare class HCTest extends Frame {
    protected out: Frame;
    n: Counts;
    constructor(out: Frame);
    call(actual: Frame, parameter?: Frame): Frame;
}
