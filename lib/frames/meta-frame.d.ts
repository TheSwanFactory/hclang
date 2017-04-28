import { Frame } from "./frame";
export declare type Context = {
    [key: string]: Frame;
};
export declare const NilContext: Context;
export declare class MetaFrame {
    protected meta: Context;
    up: Frame;
    constructor(meta?: Context, isNil?: boolean);
    get_here(key: string, origin?: MetaFrame): Frame;
    get(key: string, origin?: MetaFrame): Frame;
    set(key: string, value: Frame): MetaFrame;
}
