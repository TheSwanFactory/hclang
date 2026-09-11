import { Frame } from "./frame.ts";
import { FrameAtom } from "./frame-atom.ts";
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
import { completeAtEnd, includeOrReserve } from "./atom-syntax.ts";
import {
  type AtomSyntax,
  ScanDisposition,
  type ScanResult,
  type SigilStart,
} from "../scan.ts";

export type FrameBinding = {
  target: WeakRef<Frame>;
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
    protected data: string,
    public readonly binding?: FrameBinding,
  ) {
    super(NilContext);
    this.is.declaration = true;
  }

  protected override toData(): string {
    return this.data;
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
      const value = context.get(this.data, origin);
      if (!value.is.missing) {
        if (value.is.error) return value;

        // Every successful read gets its own lexical projection. Closures bind
        // a scoped copy, aggregates keep their exact identity behind a handle,
        // and immutable values use a plumbing copy. The shared binding is never
        // re-parented for the benefit of one reader.
        const isCanonicalBoolean = value === Frame.nil || value === Frame.all;
        const continuation = context instanceof FrameHandle
          ? context.resultContext()
          : context.projectionContext();
        const resolved = value instanceof FrameLazy
          ? value.bind(scope.captureScope())
          : value instanceof FrameArray || isCanonicalBoolean
          ? value
          : value.copy();
        if (!(resolved instanceof FrameArray) && !isCanonicalBoolean) {
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
        const copyOnWrite = context instanceof FrameHandle
          ? context.copyOnWriteScope() ?? receiverState?.copyOnWrite
          : receiverState?.copyOnWrite;
        return resolved instanceof FrameArray
          ? new FrameHandle(
            resolved,
            touchesIdentity(this.data),
            copyOnWrite,
            continuation,
          )
          : resolved;
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
      const origin = context;
      const seen = new Set<Frame>();
      let owner: Frame | undefined = context;
      while (owner && !owner.is.missing && !seen.has(owner)) {
        seen.add(owner);
        const binding = owner.resolve_here(this.data, origin);
        if (binding) {
          if (binding.value.is.error) return binding.value;
          const schema = owner.meta[`${binding.key}.<>`];
          return schema ?? Frame.error(`$!.schema-missing .${this.data}`);
        }
        owner = owner.up;
      }
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
    if (Frame.isInteger(this.data)) {
      return Frame.error(`$!.numeric-key .${this.data}`);
    }
    // `.^` declares the structural parent without visibility grading.
    if (this.data === "^") {
      const previous = out.hasDeclaredParent() ? out.parent : Frame.missing;
      const refused = out.setParent(argument);
      if (refused) return refused;
      return previous.is.missing
        ? new FrameLiteral(`.^ ${argument.toString()}`)
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
      ? new FrameLiteral(`.${this.data} ${argument.toString()}`, {
        target: new WeakRef(out),
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
    return new FrameLiteral(`.${this.data} ${schema.toString()}`, {
      target: new WeakRef(out),
      key: assignmentKey,
      value: schema,
    });
  }

  public override called_by(context: Frame): Frame {
    return this.in([context]);
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
  public static readonly OPERATOR_START = /[&|?:+\-/*%=!~^]/;
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

  public override apply(argument: Frame, parameter: Frame): Frame {
    if (this.operator === "~~") {
      return FrameType.of(argument);
    }
    return super.apply(argument, parameter);
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
