import { Frame } from "./frame";
export declare type Context = {
    [key: string]: Frame;
};
export declare const NilContext: Context;
export declare class MetaFrame {
    protected meta: Context;
    constructor(meta?: Context, isNil?: boolean);
}
