import { Frame } from "./frame";
import { FrameAtom } from "./frame-atom";
export interface IRegexpMap {
    [key: number]: RegExp;
}
export interface IPrefixMap {
    [key: number]: string;
}
export declare class FrameBlob extends FrameAtom {
    static readonly BLOB_START = "0";
    static readonly BLOB_DIGITS: IRegexpMap;
    static readonly BLOB_PREFIX: IPrefixMap;
    static fix_source(source: string): string;
    static find_base(source: string): number;
    static count_bits(source: string, base: number): bigint;
    static leading_zeros(digits: string): string;
    protected data: bigint;
    protected base: number;
    protected n_bits: bigint;
    constructor(source: string);
    called_by(context: Frame, parameter: Frame): Frame;
    string_start(): string;
    string_prefix(): string;
    canInclude(char: string): boolean;
    toString(): string;
    protected toData(): bigint;
    protected append(right_operand: FrameBlob): this;
    protected exalt(left_operand: FrameBlob): bigint;
    protected shift_left(n_bits: bigint): bigint;
    protected n_chars(): number;
}
