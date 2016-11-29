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
    static readonly BEGIN: string;
    static readonly END: string;
    static readonly kUP: string;
    static readonly nil: Frame;
    static readonly missing: Frame;
    constructor(meta?: {
        [key: string]: Frame;
    });
    get_here(key: string): Frame;
    get(key: string, origin?: this): Frame;
    in(context?: Frame): Frame;
    apply(argument: Frame): Frame;
    called_by(context: Frame): Frame;
    call(argument: Frame): Frame;
    meta_keys(): string[];
    meta_pairs(): IKeyValuePair[];
    meta_string(): string;
    meta_wrap(dataString: string): string;
    toString(): string;
}
export declare class FrameArray extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    at(index: number): Frame;
}
