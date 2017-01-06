import { Frame, FrameString } from "../frames";
export declare class Router extends Frame {
    call(argument: Frame, parameter?: Frame): FrameString;
}
export declare const pipe: (input: string) => Frame;
export declare const pipeline: (current: Frame, char: string) => Frame;
