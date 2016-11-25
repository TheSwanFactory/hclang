export declare class Frame {
    protected meta: {
        [key: string]: Frame;
    };
    static readonly BEGIN: string;
    static readonly END: string;
    static readonly nil: Frame;
    constructor(meta?: {
        [key: string]: Frame;
    });
    in(context?: Frame): this;
    get(key: string): Frame;
    call(argument: Frame): Frame;
    toString(): string;
}
export declare class FrameArray extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    at(index: number): Frame;
}
