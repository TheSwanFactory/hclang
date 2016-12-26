import { Frame, FrameList } from "./frame";
export declare class FrameExpr extends FrameList {
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    in(contexts?: Frame[]): Frame;
    call(context: Frame): Frame;
    toStringDataArray(): string[];
}
