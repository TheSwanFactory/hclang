import type { Frame } from "./frame.ts";
import { type FrameAtom, FrameQuote } from "./frame-atom.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import type { Context } from "./context.ts";
import { sigilizer } from "../execute/sigilizer.ts";
import type { SigilStart } from "../execute/sigilizer.ts";

const reducer = (current: Frame, char: string): Frame => {
  const symbol = FrameSymbol.for(char);
  const result = sigilizer.scan(current, symbol);
  return result;
};

export interface IStringConstructor {
  new (data: string, meta: Context): FrameAtom;
}

export class FrameString extends FrameQuote {
  public static readonly STRING_BEGIN = "“";
  public static readonly STRING_END = "”";
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameString.STRING_BEGIN, mode: "atom" },
  ];

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

  public reduce(starter: Frame, finish = true): Frame {
    const final = this.data.split("").reduce(reducer, starter);
    return finish ? sigilizer.scan(final, FrameSymbol.end()) : final;
  }

  protected override toData(): string {
    return this.data;
  }
}
