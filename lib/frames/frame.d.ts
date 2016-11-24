export declare class Frame {
    static readonly BEGIN: string;
    static readonly END: string;
    static readonly nil: Frame;
    call(argument: Frame): Frame;
    toString(): string;
}
export declare class FrameArray extends Frame {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>);
    at(index: number): Frame;
}
