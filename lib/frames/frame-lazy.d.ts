import { Context, Frame } from "./frame";
export declare class FrameLazy extends Frame {
    protected data: Frame;
    constructor(data: Frame, meta?: Context);
    toString(): string;
}
