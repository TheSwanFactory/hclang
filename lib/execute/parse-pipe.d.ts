import { Frame, FrameArray } from '../frames';
import { IFinish } from './terminals';
export declare class ParsePipe extends FrameArray implements IFinish {
    collector: Array<Frame>;
    protected Factory: any;
    constructor(out: Frame, factory: any);
    next(statement?: boolean): Frame;
    push(Factory: any): Frame;
    pop(Factory: any): Frame;
    finish(terminal: any): Frame;
    protected makeFrame(): any;
}
