import { Context, Frame } from '../frames';
export declare type Counts = {
    [key: string]: number;
};
export declare class HCLog extends Frame {
    prompt: boolean;
    constructor(context: Context, prompt?: boolean);
    apply(argument: Frame, _parameter?: Frame): Frame;
    private color;
}
