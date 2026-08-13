import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import type { SigilStart } from "../scan.ts";

export class FrameAlias extends FrameAtom {
  public static readonly ALIAS_BEGIN = "@";
  public static readonly SIGIL_STARTS = [
    { key: FrameAlias.ALIAS_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public override in(contexts: Frame[] = [Frame.nil]): Frame {
    const key = this.data.toString();
    const origin = contexts.find((context) => context instanceof FrameLazy) ??
      contexts[0];
    for (const context of contexts) {
      const found = this.find(context, key, origin);
      if (found instanceof Frame) {
        return found;
      }
      if (found) {
        const setter = FrameSymbol.for(found.key).setter(found.out);
        return setter;
      }
    }
    return FrameNote.key(key, this);
  }

  public override string_prefix(): string {
    return FrameAlias.ALIAS_BEGIN;
  }

  public override canInclude(char: string): boolean {
    return FrameSymbol.SYMBOL_CHAR.test(char);
  }

  protected override toData(): FrameSymbol {
    return this.data;
  }

  protected find(
    context: Frame,
    key: string,
    origin: Frame,
  ): { out: Frame; key: string } | Frame | undefined {
    while (context !== Frame.missing && context !== undefined) {
      const binding = context.resolve_here(key, origin);
      if (binding?.value.is.error) {
        return binding.value;
      }
      if (binding) {
        return { out: context, key: binding.key };
      }
      const here = context.get_here(key, origin);
      if (!here.is.missing) {
        return { out: context, key };
      }
      context = context.up;
    }
  }
}
