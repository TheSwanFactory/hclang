import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { type Context, NilContext } from "./meta-frame.ts";

export class FrameNumber extends FrameAtom {
    public static readonly NUMBER_BEGIN = /[1-9]/;
    public static readonly NUMBER_CHAR = /\d/;

    public static for(digits: string): FrameNumber {
        const exists = FrameNumber.numbers[digits];
        return exists || (FrameNumber.numbers[digits] = new FrameNumber(digits));
    }

    protected static numbers: { [key: string]: FrameNumber } = {};
    protected data: number;

    constructor(source: string, meta: Context = NilContext) {
        super(meta);
        this.data = parseInt(source, 10);
    }

    public override apply(argument: Frame, _parameter: Frame): Frame {
        // repeatedly apply argument `this.data` times
        let result = Frame.nil;
        if ((argument instanceof FrameNumber)) {
            const value = this.data * argument.data;
            result = new FrameNumber(value.toString());
        } else {
            this.range().forEach(() => {
                result = result.apply(argument, _parameter);
            });
        }
        return result;
    }

    public range(): Array<number> {
        return [...Array(this.data).keys()];
    }

    public override string_start(): string {
        return FrameNumber.NUMBER_BEGIN.toString();
    }

    public override canInclude(char: string): boolean {
        return FrameNumber.NUMBER_CHAR.test(char);
    }

    protected override toData(): number {
        return this.data;
    }

    /*
     * Math Operations
     */

    public override valueOf(): number {
        return this.data;
    }

    public add(right: FrameNumber): FrameNumber {
        const value = this.data + right.data;
        return new FrameNumber(value.toString());
    }

    public subtract(right: FrameNumber): FrameNumber {
        const value = this.data - right.data;
        return new FrameNumber(value.toString());
    }

    public multiply(right: FrameNumber): FrameNumber {
        const value = this.data * right.data;
        return new FrameNumber(value.toString());
    }

    public divide(right: FrameNumber): FrameNumber {
        const value = this.data / right.data;
        return new FrameNumber(value.toString());
    }

    public modulo(right: FrameNumber): FrameNumber {
        const value = this.data % right.data;
        return new FrameNumber(value.toString());
    }

    public power(right: FrameNumber): FrameNumber {
        const value = this.data ** right.data;
        return new FrameNumber(value.toString());
    }

    public lessThan(right: FrameNumber): Frame {
        return this.data < right.data ? Frame.all : Frame.nil;
    }

    public greaterThan(right: FrameNumber): Frame {
        return this.data > right.data ? Frame.all : Frame.nil;
    }

    public override equals(right: FrameNumber): Frame {
        return this.data === right.data ? Frame.all : Frame.nil;
    }

    public lessThanOrEqual(right: FrameNumber): Frame {
        return this.data <= right.data ? Frame.all : Frame.nil;
    }

    public greaterThanOrEqual(right: FrameNumber): Frame {
        return this.data >= right.data ? Frame.all : Frame.nil;
    }
}
