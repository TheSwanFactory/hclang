export declare class Frame {
}
export declare class FrameArray {
    protected data: Array<Frame>;
    constructor(data: Array<Frame>);
    at(index: number): Frame;
}
