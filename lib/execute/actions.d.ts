import * as frame from "../frames";
export declare type LexOptions = {
    [key: string]: any;
};
export declare type OptionMap = {
    [key: string]: LexOptions;
};
export declare class FrameStatement extends frame.Frame {
}
export declare class FrameLazyGroup extends frame.FrameLazy {
    constructor(data: Array<frame.FrameExpr>, meta?: frame.Context);
}
export declare const actions: OptionMap;
