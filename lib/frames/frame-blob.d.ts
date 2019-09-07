import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
export interface IRegexpMap {
    [key: number]: RegExp;
}
export interface IPrefixMap {
    [key: number]: string;
}
export declare class FrameBlob extends FrameAtom {
    protected base: number;
    static readonly BLOB_START = "0";
    static readonly BLOB_DIGITS: IRegexpMap;
    static readonly BLOB_KEY: IPrefixMap;
    protected static numbers: {
        [key: string]: FrameBlob;
    };
    protected data: bigint;
    protected length: number;
    constructor(source: string, base: number);
    called_by(context: Frame, parameter: Frame): Frame;
    string_start(): string;
    string_prefix(): string;
    canInclude(char: string): boolean;
    toString(): string;
    protected toData(): bigint;
    protected shift_left(base: number, length: number): this;
    protected exalt(left_operand: FrameBlob): FrameBlob;
}
