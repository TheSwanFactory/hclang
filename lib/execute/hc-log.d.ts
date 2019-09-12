import { Context, Frame } from "../frames";
export declare type Counts = {
    [key: string]: number;
};
export declare class HCLog extends Frame {
    constructor(context: Context);
    apply(argument: Frame, _parameter?: Frame): Frame;
}
