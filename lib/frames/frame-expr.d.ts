import { Frame } from "./frame";
import { FrameList } from "./frame-list";
import { Context } from "./meta-frame";
export declare class FrameExpr extends FrameList {
    constructor(data: Array<Frame>, meta?: Context);
    in(contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
    toStringDataArray(): string[];
}
