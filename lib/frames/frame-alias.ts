import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { completeAtEnd, includeOrReserve } from "./atom-syntax.ts";
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
      return includeOrReserve(
        char,
        FrameSymbol.SYMBOL_CHAR.test(char),
        `${FrameAlias.ALIAS_BEGIN}${source}`,
      );
    },
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
      const lexicalContext = receiverState?.lexicalContext ?? receiver.up;
      const lexicalFound = this.find(lexicalContext, key, origin);
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
    followInheritedLexical = followLexical,
  ): { out: Frame; key: string } | Frame | undefined {
    if (
      context === Frame.missing || context === undefined || seen.has(context)
    ) {
      return undefined;
    }
    seen.add(context);

    // A contextual handle represents target-local/declared lookup followed by
    // the context of this read. Traverse those explicit links rather than the
    // target's historical `up`, which belongs to neither this receiver nor this
    // invocation.
    if (context instanceof FrameHandle && context.readContextFrame()) {
      const targetFound = this.find(
        context.unwrap(),
        key,
        origin,
        seen,
        false,
        true,
      );
      if (targetFound) return targetFound;
      return followLexical
        ? this.find(context.readContextFrame()!, key, origin, seen)
        : undefined;
    }

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
        followInheritedLexical,
        followInheritedLexical,
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
