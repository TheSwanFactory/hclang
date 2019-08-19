import { Frame } from "./frame";
import { FrameList } from "./frame-list";
export declare class FrameArray extends FrameList {
    static readonly BEGIN_ARRAY = "[";
    static readonly END_ARRAY = "]";
    constructor(data: Array<Frame>, meta?: import("./meta-frame").Context);
    string_open(): string;
    string_close(): string;
    in(contexts?: Frame[]): Frame;
    apply(argument: Frame, parameter: Frame): this;
    at(index: number): Frame;
    length(): number;
    reset(): void;
}
