import { Frame } from "./frame";
import { FrameList } from "./frame-list";
export interface IArrayConstructor {
    new (data: Array<Frame>): FrameArray;
}
export declare class FrameArray extends FrameList {
    static readonly BEGIN_ARRAY: string;
    static readonly END_ARRAY: string;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    string_open(): string;
    string_close(): string;
    in(contexts?: Frame[]): Frame;
    apply(argument: Frame, parameter: Frame): this;
    at(index: number): Frame;
    reset(): void;
}
