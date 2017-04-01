import { Frame } from "./frame";
import { FrameList } from "./frame-list";
export declare class FrameGroup extends FrameList {
    constructor(data: Array<Frame>, meta?: {
        [key: string]: Frame;
    });
    in(contexts?: Frame[]): Frame;
}
