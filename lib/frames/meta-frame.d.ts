import { Frame } from "./frame";
export interface ISourced extends Frame {
    source: string;
}
export declare type Context = {
    [key: string]: Frame;
};
export declare const NilContext: Context;
export interface IKeyValuePair extends ReadonlyArray<string | Frame> {
    0: string;
    1: Frame;
}
export declare class MetaFrame {
    protected meta: Context;
    up: Frame;
    constructor(meta?: Context, isNil?: boolean);
    get_here(key: string, origin?: MetaFrame): Frame;
    get(key: string, origin?: MetaFrame): Frame;
    set(key: string, value: Frame): MetaFrame;
    meta_copy(): Context;
    meta_keys(): string[];
    meta_length(): number;
    meta_pairs(): Array<IKeyValuePair>;
    meta_string(): string;
    protected match_here(target: string): Frame;
}
