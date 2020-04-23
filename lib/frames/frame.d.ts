import { MetaFrame } from './meta-frame';
export declare type Flags = {
    [key: string]: boolean;
};
export declare class Frame extends MetaFrame {
    static readonly kOUT = ">>";
    static readonly kEND = "$$";
    static readonly BEGIN_EXPR = "(";
    static readonly END_EXPR = ")";
    static readonly nil: Frame;
    static readonly missing: Frame;
    static globals: Frame;
    is: Flags;
    constructor(meta?: import("./meta-frame").Context, isNil?: boolean, isMissing?: boolean);
    string_open(): string;
    string_close(): string;
    at(_index: number): Frame;
    in(_contexts?: Frame[]): Frame;
    apply(argument: Frame, _parameter: Frame): Frame;
    called_by(context: Frame, parameter: Frame): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
    toString(): string;
    asArray(): Array<Frame>;
}
