import { Frame, FrameString } from "../frames";
import { IAction, IFinish, IPerformer } from "./terminals";
export declare class LexPipe extends Frame implements IFinish, IPerformer {
    constructor(out: Frame);
    addPipeToLex(): void;
    lex_string(input: string): Frame;
    lex(source: FrameString): Frame;
    finish(_parameter: Frame): this;
    perform(actions: IAction): this;
}
