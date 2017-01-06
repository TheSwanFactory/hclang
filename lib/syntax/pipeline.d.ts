import { Frame } from "../frames";
export declare class Router extends Frame {
}
export declare const pipe: (input: string) => Frame;
export declare const pipeline: (current: Frame, char: string) => Frame;
