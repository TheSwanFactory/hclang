import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
import { hasCharacterContent } from "./frame-text.ts";
import { FrameWord } from "./frame-word.ts";
import { FrameNote } from "./frame-note.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameSchema } from "./frame-schema.ts";
import { FrameType } from "./frame-type.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { BoundMethod } from "./bound-method.ts";
import { methodEffect, touchesIdentity } from "./effect-marker.ts";
import { FrameCurry } from "../ops/frame-curry.ts";
import { isFrameMatcher } from "./frame-match.ts";
import { type Context, NilContext } from "./context.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import {
  completeAtEnd,
  includeOrReserve,
  TIME_DELIMITER,
} from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

/**
 * What a declaration echo records: the scope it wrote, the key and the value.
 *
 * The scope is held directly. A `WeakRef` would look lighter, but every one an
 * evaluation creates is kept alive until the host's current job ends, and the
 * CLI runs a whole file as one job, so each call scope a closure declared into
 * outlived the program's use of it (#426). The echo and its scope form an
 * ordinary cycle, which the collector frees once neither is reachable.
 */
export type FrameBinding = {
  target: Frame;
  key: string;
  value: Frame;
};

/**
 * The echo a declaration answers, which is a declaration and not an element.
 *
 * An aggregate retains this in its data plane so the source it was built from
 * still prints, but a declaration wrote a property: counting it as an element
 * too would put one value in both planes and iterate it twice.
 */
export class FrameLiteral extends FrameAtom {
  constructor(
    protected data: string | (() => string),
    public readonly binding?: FrameBinding,
  ) {
    super(NilContext);
    this.is.declaration = true;
  }

  /**
   * The echo's text, rendered the first time it is asked for. Rendering it at
   * declaration spelled out the whole declared value every time, and the echo
   * is rarely printed: a Figure built from 16,384 children rendered all of
   * them, each with its methods, and spent most of its time there (#435).
   */
  protected override toData(): string {
    if (typeof this.data !== "string") this.data = this.data();
    return this.data;
  }

  /**
   * The same echo, held by `owner`. A copy of the declaring aggregate holds
   * the copied property, so it needs an echo that names it as the holder.
   */
  public reownedBy(owner: Frame): FrameLiteral {
    if (!this.binding) return this;
    return new FrameLiteral(this.data, {
      ...this.binding,
      target: owner,
    });
  }
}

export class FrameSymbol extends FrameAtom {
  public static readonly SYMBOL_BEGIN = /[a-zA-Z]/;
  public static readonly SYMBOL_CHAR = /[-\w]/;
  public static readonly OPERATOR_CHARS = /[&|?:+\-/*%=<>!~^]/;
  /** The prefix that makes a printed symbol read back as the same symbol. */
  public static readonly ADDRESS_BEGIN = ".";
  public static readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameSymbol.SYMBOL_BEGIN.toString(), mode: "atom" },
  ];

  public static readonly SYNTAX: AtomSyntax = {
    NAME: "FrameSymbol",
    SIGIL_STARTS: FrameSymbol.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      return includeOrReserve(
        char,
        FrameSymbol.SYMBOL_CHAR.test(char),
        source,
      );
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameSymbol(source),
  };

  public static for(symbol: string): FrameSymbol {
    const exists = FrameSymbol.symbols[symbol];
    return exists || (FrameSymbol.symbols[symbol] = new FrameSymbol(symbol));
  }

  public static end(): FrameSymbol {
    return FrameSymbol.for(Frame.kEND);
  }

  /**
   * A symbol in value position: an address rather than a pending lookup.
   *
   * Iteration synthesizes one per member, because a tuple key has to be the
   * thing that addresses the member rather than a description of it. This is
   * deliberately not interned: `for` hands back the shared symbol the front end
   * uses as a source character, and marking that one would dot every lexeme.
   */
  public static address(key: string): FrameSymbol {
    const symbol = new FrameSymbol(key);
    symbol.is.address = true;
    return symbol;
  }

  protected static symbols: { [key: string]: FrameSymbol } = {};

  constructor(protected data: string, meta: Context = NilContext) {
    super(meta);
  }

  public override in(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input);
    const first = scope.argument;
    // A method body resolves against its receiver, so visibility asks the same
    // question no matter which path the access arrives by.
    const receiverState = scope.receiverState;
    const receiver = receiverState?.receiver;
    for (const context of scope.lookupFrames()) {
      const explicitOrigin = this.get_here(Frame.kOUT);
      const origin = receiver ??
        (context instanceof FrameHandle && !explicitOrigin.is.missing
          ? explicitOrigin
          : context);
      const value = scope.isArgumentLayer(context)
        ? context.getOwn(this.data, origin)
        : context.get(this.data, origin);
      if (!value.is.missing) {
        if (value.is.error) return value;

        // Every successful read gets its own lexical projection. Closures bind
        // a scoped copy, aggregates keep their exact identity behind a handle,
        // and immutable values use a plumbing copy. The shared binding is never
        // re-parented for the benefit of one reader, so only a projection this
        // read created takes the read site as its `up`: a closure that is
        // already bound answers itself and keeps the scope it was made in.
        const isCanonicalBoolean = value === Frame.nil || value === Frame.all;
        const continuation = context instanceof FrameHandle
          ? context
          : context.projectionContext();
        const resolved = value instanceof FrameLazy
          ? value.bind(scope.captureScope())
          : value instanceof FrameArray || isCanonicalBoolean
          ? value
          : value.copy();
        if (resolved !== value) {
          resolved.up = continuation;
        }

        // Built-in control flow receives the exact active capability only for
        // callbacks it invokes; ordinary closure calls do not inherit it.
        if (resolved instanceof FrameCurry && receiverState) {
          resolved.withReceiverState(receiverState);
        }
        if (resolved.is.immediate === true) {
          return resolved.call(context);
        }
        // A bare method found through the active raw receiver must obey the same
        // effect and copy rules as dotted lookup through a handle.
        if (
          resolved instanceof FrameLazy && receiverState &&
          context === receiver &&
          this.isReceiverPathValue(receiver, value, origin)
        ) {
          return new BoundMethod(
            resolved,
            receiver,
            receiverState.mutable,
            methodEffect(this.data),
            receiverState.copyOnWrite,
            receiverState.lexicalContext,
          );
        }
        // A method read by dot from a value no name holds binds to that value
        // as a name would, immutably: it may still be shared, so a mutating
        // method answers a functional update rather than writing it.
        if (
          resolved instanceof FrameLazy && this.is.address === true &&
          !(context instanceof FrameHandle) && context.ownsIdentity() &&
          this.isReceiverPathValue(context, value, origin)
        ) {
          return new BoundMethod(
            resolved,
            context,
            false,
            methodEffect(this.data),
          );
        }
        const copyOnWrite = context instanceof FrameHandle
          ? context.copyOnWriteScope() ?? receiverState?.copyOnWrite
          : receiverState?.copyOnWrite;
        if (!(resolved instanceof FrameArray)) return resolved;
        const handle = new FrameHandle(
          resolved,
          touchesIdentity(this.data),
          copyOnWrite,
          continuation,
        );
        return copyOnWrite ? handle.heldBy(context) : handle;
      }
    }
    return FrameNote.key(first.id + "." + this.data, first);
  }

  /** Whether a method was found on the receiver or its declared parents. */
  private isReceiverPathValue(
    receiver: Frame,
    value: Frame,
    origin: Frame,
  ): boolean {
    const seen = new Set<Frame>();
    let current: Frame | undefined = receiver;
    while (current && !current.is.missing && !seen.has(current)) {
      seen.add(current);
      const local = current.get_here(this.data, origin);
      if (!local.is.missing) return local === value;
      current = current.hasDeclaredParent() ? current.parent : undefined;
    }
    return false;
  }

  /** Resolve the schema belonging to this binding, not to its bound value. */
  public bindingSchema(input: EvaluationInput = []): Frame {
    const scope = EvaluationScope.from(input);
    const first = scope.argument;
    for (const context of scope.lookupFrames()) {
      const binding = context.resolve(this.data, context);
      if (!binding) continue;
      if (binding.value.is.error) return binding.value;
      const schema = binding.owner.meta[`${binding.key}.<>`];
      return schema ?? Frame.error(`$!.schema-missing .${this.data}`);
    }
    return FrameNote.key(first.id + "." + this.data, first);
  }

  public override apply(argument: Frame, _parameter: Frame): Frame {
    const out = this.get(Frame.kOUT);
    if (argument instanceof FrameHandle) {
      argument = argument.unwrap();
    }
    // `.0` already addresses the first element, so declaring it would give one
    // address two meanings, and would put two members under one key in a
    // doubled stream. Refusing it is what makes one key slot well-formed,
    // whether or not the index exists yet.
    //
    // The refusal is marked, because this one is the aggregate's rather than the
    // write's: the key collides with the addresses the aggregate itself assigns,
    // so the value cannot be well-formed at all. A schema mismatch, a constant,
    // or a visibility grade refuses one write to a slot that was fine, and
    // leaves a well-formed value with that write undone.
    if (Frame.isInteger(this.data)) {
      const refusal = Frame.error(`$!.numeric-key .${this.data}`);
      refusal.is.addressTaken = true;
      return refusal;
    }
    // `.^` declares the structural parent without visibility grading.
    if (this.data === "^") {
      const previous = out.hasDeclaredParent() ? out.parent : Frame.missing;
      const refused = out.setParent(argument);
      if (refused) return refused;
      return previous.is.missing
        ? new FrameLiteral(() => `.^ ${argument.toString()}`)
        : argument;
    }
    const binding = out.resolve_here(this.data, out);
    if (binding?.value.is.error) return binding.value;
    const assignmentKey = binding?.key ?? this.data;
    const schemaKey = `${assignmentKey}.<>`;

    if (argument instanceof FrameSchema) {
      out.set(schemaKey, argument);
      return this;
    }

    const schema = out.get(schemaKey);
    if (!schema.is.missing && !this.matchesSchema(schema, argument)) {
      return Frame.error(
        `$!.type-error .${this.data} ${schema.toString()} ${argument.toString()}`,
      );
    }

    const previous = binding?.value ?? out.get_here(this.data, out);
    if (!previous.is.missing && this.isConstant(assignmentKey)) {
      return Frame.error(`$error{$is-constant .${this.data}}`);
    }

    out.set(assignmentKey, argument);
    return previous.is.missing
      ? new FrameLiteral(() => `.${this.data} ${argument.toString()}`, {
        target: out,
        key: assignmentKey,
        value: argument,
      })
      : argument;
  }

  public setter(out: Frame): FrameSymbol {
    const meta: Context = {};
    if (!out.is.void) {
      meta[Frame.kOUT] = out;
    }
    const setter = new FrameSymbol(this.data, meta);
    // An evaluated `.name` is in value position, so it prints as the address it
    // is rather than as the lookup its spelling alone would re-read as.
    setter.is.address = true;
    return setter;
  }

  /** Complete a statement whose declared value is the schema itself. */
  public defineSchema(schema: FrameSchema): Frame {
    const out = this.get(Frame.kOUT);
    const binding = out.resolve_here(this.data, out);
    if (binding?.value.is.error) return binding.value;
    const assignmentKey = binding?.key ?? this.data;
    const previous = binding?.value ?? out.get_here(this.data, out);
    if (!previous.is.missing && this.isConstant(assignmentKey)) {
      return Frame.error(`$error{$is-constant .${this.data}}`);
    }
    out.set(assignmentKey, schema);
    out.set(`${assignmentKey}.<>`, schema);
    return new FrameLiteral(() => `.${this.data} ${schema.toString()}`, {
      target: out,
      key: assignmentKey,
      value: schema,
    });
  }

  public override called_by(context: Frame): Frame {
    if (this.is.address === true && this.data === "<>") {
      return FrameType.of(context);
    }
    // A size operator answers for the receiver itself rather than looking a
    // name up, so the scope a value was read from never answers for it (#411).
    // Only an address is one, since the lexer looks `#` up as the comment.
    if (
      this.is.address === true && Frame.SIZE_OPERATORS.includes(this.data)
    ) {
      return context.referent().sizeFor(this.data);
    }
    // An address applied by a receiver reads that member, `o .x`. Two
    // receivers take the name itself instead (#429). A pending declaration
    // stores it, so `.k .x` keeps the key and `o k` reads `o.x` later; the
    // stored name is a fresh address, so it carries no write authority over
    // the scope `.x` was written in. Text with no such member, which is all
    // text but a document's `.body`, spells it: `“” .x` is `“.x”`.
    if (this.is.address === true && FrameSymbol.isIdentifier(this.data)) {
      if (context instanceof FrameSymbol && context.isPendingDeclaration()) {
        return context.apply(FrameSymbol.address(this.data), Frame.nil);
      }
      if (hasCharacterContent(context) && context.get(this.data).is.missing) {
        return context.apply(this, Frame.nil);
      }
    }
    return this.in([context]);
  }

  /**
   * An address is a name, and equals a walked word with its spelling (#429).
   * Anything else compares as it prints, as for every frame.
   */
  public override equals(other: Frame): Frame {
    if (this.is.address === true) {
      const right = other.referent();
      if (right instanceof FrameWord) {
        return right.spelling() === this.data ? Frame.all : Frame.nil;
      }
    }
    return super.equals(other);
  }

  /** Whether this is a declaration still waiting for its value, `.k`. */
  public isPendingDeclaration(): boolean {
    return this.is.address === true && !this.get_here(Frame.kOUT).is.missing;
  }

  /** Whether a spelling is an ordinary name rather than an operator or key. */
  public static isIdentifier(spelling: string): boolean {
    return /^[a-zA-Z][-\w]*$/.test(spelling);
  }

  public override string_start(): string {
    return FrameSymbol.SYMBOL_BEGIN.toString();
  }

  /**
   * An address renders with its dot, so canonical output re-reads as input.
   *
   * Only a symbol in value position takes one, and that distinction is the whole
   * rule. An unevaluated symbol is a pending lookup, and `a` is exactly how a
   * lookup is written, so dotting it would print a declaration instead. An
   * evaluated symbol is an address a caller can apply, and printing `meta` for
   * one yields a lookup when re-read rather than the symbol `.meta` — which is
   * the re-readability that properties-first rendering was chosen for, and what
   * makes a stream of `[key, value]` tuples round-trip.
   */
  public override string_prefix(): string {
    return this.is.address === true ? FrameSymbol.ADDRESS_BEGIN : "";
  }

  /**
   * The name itself, which is the key this symbol addresses.
   *
   * Rendering decorates a symbol in value position with its address dot, so
   * anything deciding meaning from the name asks for this rather than comparing
   * printed forms.
   */
  public spelling(): string {
    return this.data;
  }

  protected override toData(): string {
    return this.data === "$$" ? "\n" : this.data;
  }

  private matchesSchema(schema: Frame, value: Frame): boolean {
    return !isFrameMatcher(schema) || schema.match(value).matched;
  }

  private isConstant(key = this.data): boolean {
    return /^_*\p{Lu}/u.test(key);
  }
}

export class FrameOperator extends FrameSymbol {
  /**
   * Characters that begin an operator lexeme.
   *
   * `%` is absent because the time family registers it as an exact key, which
   * wins dispatch over this pattern. Listing it here would claim a start the
   * operator never receives, and the doubled spelling reaches this class from
   * `FrameTime.recognize` rather than from a sigil start of its own.
   */
  public static readonly OPERATOR_START = /[&|?:+\-/*=!~^]/;
  public static override readonly SIGIL_STARTS: readonly SigilStart[] = [
    { key: FrameOperator.OPERATOR_START.toString(), mode: "atom" },
  ];

  public static override readonly SYNTAX: AtomSyntax = {
    NAME: "FrameOperator",
    SIGIL_STARTS: FrameOperator.SIGIL_STARTS,
    recognize: (symbol: Frame, source = ""): ScanResult => {
      const char = symbol.toString();
      // Comparison brackets belong to the schema syntax, not to an operator.
      if (char === "<" || char === ">") {
        return { disposition: ScanDisposition.CompleteRedispatch };
      }
      // So does a time delimiter. Without this an operator would swallow the
      // sigil that opens the literal beside it, and `2*%PT1H%` would lex as an
      // operator `*%` followed by an unterminated one — making the family
      // whitespace-sensitive, which nothing else in the language is. `%` stays
      // an operator *continuation* character for names, because `.%%` is how
      // modulo is spelled as a property.
      if (char === TIME_DELIMITER) {
        return { disposition: ScanDisposition.CompleteRedispatch };
      }
      // A hyphen is the one operator character that also continues an
      // identifier, so it reserves an abutting anchor exactly as `name-` does.
      // Every other operator ends at a boundary and leaves `+$` legal.
      return includeOrReserve(char, FrameOperator.Accepts(char), source);
    },
    finish: completeAtEnd,
    fromSource: (source: string): Frame => new FrameOperator(source),
  };

  public readonly operator: string;

  constructor(source: string, meta: Context = NilContext) {
    super(source, meta);
    this.operator = source;
    this.is.operator = true;
  }

  public static operator_chars(): string {
    return "&|?:+\\-*%<>!";
    // FrameOperator.OPERATOR_CHARS.source.slice(1, -1)
  }

  public static Accepts(char: string): boolean {
    return FrameOperator.OPERATOR_CHARS.test(char);
  }

  public override in(input: EvaluationInput = []): Frame {
    const receiverState = EvaluationScope.from(input).receiverState;
    if (!receiverState) return this;
    const bound = this.copy();
    bound.receiverState = receiverState;
    return bound;
  }

  public override called_by(context: Frame): Frame {
    const value = FrameSymbol.for(this.data).called_by(context);
    return value instanceof FrameCurry && this.receiverState
      ? value.withReceiverState(this.receiverState)
      : value;
  }

  public override string_start(): string {
    return FrameOperator.OPERATOR_CHARS.toString();
  }
}
