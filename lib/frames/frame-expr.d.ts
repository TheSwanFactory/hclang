import { Frame } from "./frame";
import { FrameList } from "./frame-list";
export declare class FrameExpr extends FrameList {
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    in(contexts?: Frame[]): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
    toStringDataArray(): string[];
}
