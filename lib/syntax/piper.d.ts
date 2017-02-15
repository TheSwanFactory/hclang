import { Context, Frame } from "../frames";
export declare class EvalPipe extends Frame {
    constructor(out: Frame, meta?: Context);
}
export declare const piper: (input: string, context?: Context) => Frame;
