import { Frame } from "./frame";
import { FrameArray } from "./frame-array";
export declare class FrameExpr extends FrameArray {
    static readonly EXPR_BEGIN: string;
    static readonly EXPR_END: string;
    static extract(key: string): FrameExpr;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): Frame;
    call(context: Frame): Frame;
    toStringData(): string;
    toString(): string;
}
