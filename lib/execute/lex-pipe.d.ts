import { Frame, FrameString } from "../frames";
import { IAction, IPerformer } from "./terminals";
export declare class LexPipe extends Frame implements IPerformer {
    constructor(out: Frame);
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(parameter: Frame): this;
    perform(actions: IAction): this;
}
