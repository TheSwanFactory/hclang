import { Frame, FrameGroup } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class GroupPipe extends ParsePipe {
    constructor(out: Frame);
    protected makeFrame(): FrameGroup;
}
