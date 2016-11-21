export declare class Frame {
    call(argument: Frame): Frame;
}
export declare class FrameArray {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>);
    at(index: number): Frame;
}
