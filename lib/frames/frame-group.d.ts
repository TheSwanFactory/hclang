import { Frame } from "./frame";
import { FrameList } from "./frame-list";
import { Context } from "./meta-frame";
export declare class FrameGroup extends FrameList {
    constructor(data: Array<Frame>, meta?: Context);
    in(contexts?: Frame[]): Frame;
}
