import * as BI from "big-integer";
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
    static count_bits(source: string, base: number): BI.BigInteger;
    static leading_zeros(digits: string): string;
    protected data: BI.BigInteger;
    protected base: number;
    protected n_bits: BI.BigInteger;
    constructor(source: string);
    called_by(context: Frame, parameter: Frame): Frame;
    string_start(): string;
    string_prefix(): string;
    canInclude(char: string): boolean;
    toString(): string;
    protected toData(): BI.BigInteger;
    protected append(right_operand: FrameBlob): this;
    protected exalt(left_operand: FrameBlob): BI.BigInteger;
    protected shift_left(n_bits: BI.BigInteger): BI.BigInteger;
    protected n_chars(): number;
}
