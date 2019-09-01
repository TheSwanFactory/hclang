import { Frame } from "../frames";
import { ParsePipe } from "./parse-pipe";
export declare class GroupPipe extends ParsePipe {
    constructor(out: Frame, factory: any);
    call(argument: Frame, parameter?: Frame): Frame;
}
