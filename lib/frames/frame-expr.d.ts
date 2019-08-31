import { Frame } from "./frame";
import { FrameList } from "./frame-list";
export declare class FrameExpr extends FrameList {
    constructor(data: Array<Frame>, meta?: import("./meta-frame").Context);
    in(contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
    toStringDataArray(): string[];
}
