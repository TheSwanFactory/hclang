import { Frame } from "./frame";
import { FrameExpr } from "./frame-expr";
import { Context } from "./meta-frame";
export declare class FrameGroup extends FrameExpr {
    constructor(data: Array<Frame>, meta?: Context);
    eval_one(contexts?: Frame[]): Frame;
    in(contexts?: Frame[]): Frame;
}
