import type { Frame } from "./frame.ts";
import { type FrameAtom, FrameQuote } from "./frame-atom.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type Context, NilContext } from "./meta-frame.ts";

const reducer = (current: Frame, char: string): Frame => {
    const symbol = FrameSymbol.for(char);
    const result = current.call(symbol);
    return result;
};

export interface IStringConstructor {
    new (data: string, meta: Context): FrameAtom;
}

export class FrameString extends FrameQuote {
    public static readonly STRING_BEGIN = "“";
    public static readonly STRING_END = "”";

    constructor(protected data: string, meta: Context = NilContext) {
        super(meta);
    }

    public override apply(argument: FrameAtom): FrameString {
        let value = argument.toString();
        if (argument instanceof FrameString) {
            value = argument.data;
        }
        return new FrameString(this.data + value);
    }

    public override string_prefix(): string {
        return FrameString.STRING_BEGIN;
    }

    public override string_suffix(): string {
        return FrameString.STRING_END;
    }

    public reduce(starter: Frame): Frame {
        const final = this.data.split("").reduce(reducer, starter);
        const result = final.call(FrameSymbol.end());
        return result;
    }

    protected override toData(): string {
        return this.data;
    }
}
