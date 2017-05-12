import { Context, Frame, FrameString } from "../frames";
import { IPerformer } from "./terminals";
export declare class LexPipe extends Frame implements IPerformer {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(argument: Frame): Frame;
    perform(actions: Context): this;
}
