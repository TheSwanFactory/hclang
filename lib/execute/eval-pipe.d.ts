import { Context, Frame } from "../frames";
export declare class EvalPipe extends Frame {
    constructor(out: Frame, meta?: Context);
    apply(expr: Frame, context: Frame): Frame;
}
