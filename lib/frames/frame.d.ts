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
    static readonly kOUT: string;
    static readonly kDIRECT: string;
    static readonly kEND: string;
    static readonly BEGIN_EXPR: string;
    static readonly END_EXPR: string;
    static readonly nil: Frame;
    static readonly missing: Frame;
    static globals: Frame;
    up: Frame;
    constructor(meta?: Context, isNil?: boolean);
    string_open(): string;
    string_close(): string;
    get_here(key: string, origin?: Frame): Frame;
    get(key: string, origin?: Frame): Frame;
    set(key: string, value: Frame): Frame;
    at(index: number): Frame;
    in(contexts?: Frame[]): Frame;
    apply(argument: Frame, parameter: Frame): Frame;
    called_by(context: Frame, parameter: Frame): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
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
    constructor(data: Array<Frame>, meta?: Context);
    toStringDataArray(): string[];
    toStringArray(): string[];
    toString(): string;
    asArray(): Array<Frame>;
}
