import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
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
    recognize: (symbol: Frame): ScanResult =>
      includeOrEnd(FrameSymbol.SYMBOL_CHAR.test(symbol.toString())),
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameAlias(source),
  };

  protected data: FrameSymbol;

  constructor(source: string, meta = NilContext) {
    super(meta);
    this.data = FrameSymbol.for(source);
  }

  public override in(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input);
    const key = this.data.toString();
    const receiverState = scope.receiverState;
    const receiver = receiverState?.receiver;
    const origin = receiver ?? scope.closure ??
      scope.lookupFrames().find((context) => context instanceof FrameLazy) ??
      scope.argument;

    // Receiver and declared-parent hits are writes to object state, so they
    // require the method capability. A miss searches the closure's captured
    // lexical scope, never caller-owned argument or parameter values.
    const receiverFound = receiver
      ? this.find(receiver, key, origin, new Set(), false)
      : undefined;
    if (receiverFound instanceof Frame) {
      return receiverFound;
    }
    if (receiverFound) {
      if (!authorizedReceiverWriteTarget(receiverState)) {
        return Frame.error(`$!.method-not-mutating @${key}`);
      }
      return this.setterFor(receiverFound, key, receiverState?.copyOnWrite);
    }

    if (receiver) {
      const lexicalFound = this.find(receiver.up, key, origin);
      if (lexicalFound instanceof Frame) return lexicalFound;
      return lexicalFound
        ? this.setterFor(lexicalFound, key, receiverState?.copyOnWrite)
        : FrameNote.key(key, this);
    }

    for (const context of scope.lookupFrames()) {
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
