import { Context, Frame } from "../frames";
import { ICurryFunction } from "../ops";
export interface IPerformer extends Frame {
    perform(actions: Context): Frame;
}
export declare class Terminal extends Frame {
    protected data: ICurryFunction;
    static end(): Terminal;
    constructor(data: ICurryFunction);
    apply(argument: Frame, parameter: Frame): Frame;
    protected toData(): any;
}
export declare const terminals: Context;
