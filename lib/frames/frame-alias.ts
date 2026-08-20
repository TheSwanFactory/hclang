import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import { completeAtEnd, includeOrEnd } from "./atom-syntax.ts";
import { authorizedReceiverWriteTarget } from "./bound-method.ts";
import type { AtomSyntax, ScanResult, SigilStart } from "../scan.ts";

export class FrameAlias extends FrameAtom {
  public static readonly ALIAS_BEGIN = "@";
  public static readonly SIGIL_STARTS = [
    { key: FrameAlias.ALIAS_BEGIN, mode: "atom" },
  ] as const satisfies readonly SigilStart[];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameAlias",
    SIGIL_STARTS: FrameAlias.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      return FrameSymbol.scanMutatingSuffix(source, char) ??
        includeOrEnd(FrameSymbol.SYMBOL_CHAR.test(char));
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameAlias(source),
  };

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public override in(contexts: Frame[] = [Frame.nil]): Frame {
    const key = this.data.toString();
    const receiverState = Frame.receiverStateIn(contexts);
    const receiver = receiverState?.receiver;
    const origin = receiver ??
      contexts.find((context) => context instanceof FrameLazy) ??
      contexts[0];

    // Receiver declarations are readable from every method, but writable only
    // when BoundMethod supplied the target selected by its declared effect and
    // the handle's mutability. Declared parents belong to the same receiver
    // path; lexical parents do not grant receiver-write authority.
    const receiverFound = receiver
      ? this.find(receiver, key, origin, new Set(), false)
      : undefined;
    if (receiverFound instanceof Frame) {
      return receiverFound;
    }
    if (receiverFound) {
      const writeTarget = authorizedReceiverWriteTarget(
        receiverState?.writeAuthority,
      );
      if (!writeTarget) {
        return Frame.error(`$!.method-not-mutating @${key}`);
      }
      // Resolve again against the capability target so the setter stays
      // anchored there if read and write receiver projections ever diverge.
      const authorized = this.find(
        writeTarget,
        key,
        origin,
        new Set(),
        false,
      );
      if (authorized instanceof Frame) {
        return authorized;
      }
      if (authorized) {
        return this.setterFor(authorized, key, receiverState?.copyOnWrite);
      }
      return FrameNote.key(key, this);
    }

    const searched = receiver
      ? contexts.filter((context) => context !== receiver)
      : contexts;
    for (const context of searched) {
      const found = this.find(context, key, origin);
      if (found instanceof Frame) {
        return found;
      }
      if (found) {
        return this.setterFor(found, key, receiverState?.copyOnWrite);
      }
    }
    return FrameNote.key(key, this);
  }

  public override string_prefix(): string {
    return FrameAlias.ALIAS_BEGIN;
  }

  protected override toData(): FrameSymbol {
    return this.data;
  }

  protected find(
    context: Frame,
    key: string,
    origin: Frame,
    seen: Set<Frame> = new Set(),
    followLexical = true,
  ): { out: Frame; key: string } | Frame | undefined {
    if (
      context === Frame.missing || context === undefined || seen.has(context)
    ) {
      return undefined;
    }
    seen.add(context);

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

    if (context.hasDeclaredParent()) {
      const inherited = this.find(
        context.parent,
        key,
        origin,
        seen,
        followLexical,
      );
      if (inherited) return inherited;
    }
    return followLexical
      ? this.find(context.up, key, origin, seen, followLexical)
      : undefined;
  }

  private setterFor(
    found: { out: Frame; key: string },
    key: string,
    copyOnWrite?: WeakSet<Frame>,
  ): Frame {
    if (copyOnWrite && !copyOnWrite.has(found.out)) {
      return Frame.error(`$!.copy-on-write-boundary .${key}`);
    }
    return FrameSymbol.for(found.key).setter(found.out);
  }
}
