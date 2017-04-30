import { Context, MetaFrame } from "./meta-frame";
export declare class Frame extends MetaFrame {
    static readonly kOUT: string;
    static readonly kEND: string;
    static readonly BEGIN_EXPR: string;
    static readonly END_EXPR: string;
    static readonly nil: Frame;
    static readonly missing: Frame;
    static globals: Frame;
    callme: boolean;
    constructor(meta?: Context, isNil?: boolean);
    string_open(): string;
    string_close(): string;
    at(index: number): Frame;
    in(contexts?: Frame[]): Frame;
    apply(argument: Frame, parameter: Frame): Frame;
    called_by(context: Frame, parameter: Frame): Frame;
    call(argument: Frame, parameter?: Frame): Frame;
    toString(): string;
    asArray(): Array<Frame>;
    isVoid(): boolean;
}
