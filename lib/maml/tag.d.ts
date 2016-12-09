import { Frame, FrameExpr, FrameLazy } from "../frames";
export declare const tag: (name: string, body: Frame) => FrameExpr;
export declare const tag_lazy: (name: string) => FrameLazy;
