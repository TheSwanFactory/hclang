export declare type Context = {
    [key: string]: Frame;
};
export interface IKeyValuePair extends ReadonlyArray<string | Frame> {
    0: string;
    1: Frame;
}
export declare const Void: Context;
export declare class Frame {
    private meta;
    static readonly BEGIN_EXPR: string;
    static readonly END_EXPR: string;
    static readonly kUP: string;
    static readonly nil: Frame;
    static readonly missing: Frame;
    constructor(meta?: {
        [key: string]: Frame;
    });
    string_open(): string;
    string_close(): string;
    get_here(key: string): Frame;
    get(key: string, origin?: this): Frame;
    set(key: string, value: Frame): Frame;
    at(index: number): Frame;
    in(context?: Frame): Frame;
    apply(argument: Frame): Frame;
    called_by(context: Frame): Frame;
    call(argument: Frame): Frame;
    meta_copy(): Context;
    meta_keys(): string[];
    meta_length(): number;
    meta_pairs(): Array<IKeyValuePair>;
    meta_string(): string;
    toString(): string;
    asArray(): Array<Frame>;
}
export declare class FrameAtom extends Frame {
    string_prefix(): string;
    string_suffix(): string;
    toStringData(): string;
    toString(): string;
    protected toData(): any;
}
export declare class FrameList extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    toStringDataArray(): string[];
    toStringArray(): string[];
    toString(): string;
    asArray(): Array<Frame>;
}
