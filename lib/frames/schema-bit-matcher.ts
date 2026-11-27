import { FrameInt } from "./frame-int.ts";
import { FrameSymbol } from "./frame-symbol.ts";
import { type EvaluationInput, EvaluationScope } from "./evaluation-scope.ts";
import { Frame } from "./frame.ts";
import { FrameAlias } from "./frame-alias.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameBlob } from "./frame-blob.ts";
import { FrameList } from "./frame-list.ts";
import { FrameName } from "./frame-name.ts";
import { FrameNumeric, REPETITION_TEXT_LIMIT } from "./frame-numeric.ts";
import { matchFailure, type MatchResult, matchSuccess } from "./frame-match.ts";
import {
  callSchemaPredicate,
  EnumerationSchemaMatcher,
  evaluateSchemaTerm,
  isSchemaFrame,
  type SchemaMatcher,
  schemaPredicateHasEffect,
  UnsupportedSchemaMatcher,
  unwrapSchemaSyntax,
} from "./schema-matcher.ts";

/**
 * The named captures one parse has made so far, in parse order (#311). A
 * deferred capture reads them, so a width captured by an earlier element of a
 * repetition sizes a later element's field. Nothing outside the parse is
 * written: the scope lives only as long as the match.
 */
type CaptureScope = Map<string, Frame>;

/** One layout's answer at a cursor: its evidence and where it stopped. */
type BitStep = { evidence: Frame; end: number } | Frame;

/**
 * A bit layout that can match at a cursor inside a larger blob, so it can be
 * one capture of a sequence, one option of an alternative, or the element of
 * a repetition. `terminal` layouts consume every remaining bit and so must
 * come last. `label` names the capture in errors.
 */
interface BitLayout {
  readonly terminal: boolean;
  format(): string;
  matchAt(
    value: FrameBlob,
    offset: number,
    scope: CaptureScope,
    label: string,
  ): BitStep;
}

type BitCapture = {
  name: string;
  bits: number | null | Frame;
  layout?: BitLayout;
};

function isBitLayout(
  matcher: SchemaMatcher | BitLayout,
): matcher is BitLayout {
  return typeof (matcher as Partial<BitLayout>).matchAt === "function";
}

function bitInputInvalid(value: Frame): MatchResult {
  return matchFailure(Frame.error(`$!.bit-input-invalid ${value.toString()}`));
}

/** A blob matched by a layout that consumes all of it. */
function matchWhole(
  layout: BitLayout,
  value: Frame,
  label: string,
): MatchResult {
  if (!(value instanceof FrameBlob)) return bitInputInvalid(value);
  const step = layout.matchAt(value, 0, new Map(), label);
  if (step instanceof Frame) return matchFailure(step);
  if (step.end < value.bitLength()) {
    return matchFailure(
      Frame.error(`$!.unconsumed-bits ${value.bitLength() - step.end}`),
    );
  }
  return matchSuccess(step.evidence);
}

/** The argument a deferred capture receives: every capture made so far. */
function scopeFrame(scope: CaptureScope): Frame {
  const frame = new FrameArray([]);
  for (const [name, value] of scope) frame.set(name, value);
  return frame;
}

/** Compile only schemas that use the built-in Bit matcher syntax. */
export function compileBitSchemaMatcher(
  data: Frame[],
  input?: EvaluationInput,
): SchemaMatcher | Frame | undefined {
  if (data.length === 1) {
    const expression = data[0];
    const terms = expression instanceof FrameList
      ? expression.asArray().map(unwrapSchemaSyntax)
      : [];
    const unit = terms.length === 2 ? bitUnit(terms[1], input) : undefined;
    if (unit instanceof Frame) return unit;
    if (unit !== undefined) {
      const width = input === undefined
        ? terms[0]
        : evaluateSchemaTerm(terms[0], input);
      if (width.is.error) return width;
      const exact = width instanceof FrameBlob
        ? width.unsignedValue()
        : width instanceof FrameNumeric
        ? width.exactInt(BigInt(Number.MAX_SAFE_INTEGER))
        : undefined;
      const bits = typeof exact === "bigint" ? exact * BigInt(unit) : undefined;
      if (bits === 0n) return Frame.error("$!.bit-width 0");
      return bits !== undefined && bits > 0n &&
          bits <= BigInt(Number.MAX_SAFE_INTEGER)
        ? new ExactBitSchemaMatcher(Number(bits))
        : new UnsupportedSchemaMatcher();
    }

    const array = unwrapSchemaSyntax(expression);
    if (array instanceof FrameArray) {
      const entries = array.asArray();
      if (
        entries.length === 1 && bitUnit(unwrapSchemaSyntax(entries[0])) === 1
      ) {
        return new RemainderBitSchemaMatcher();
      }
      if (entries.length === 1 && !isNamedCapture(entries[0])) {
        const element = bitLayoutOf(entries[0], input);
        // An element written with bit syntax that fails to compile, such as
        // `<0@Bit>`, reports why; anything else keeps its enumeration meaning.
        if (element instanceof Frame) {
          if (containsBitSyntax(entries)) return element;
        } else if (element !== undefined) {
          return new RepetitionBitLayout(element);
        }
      }
      const sequence = compileBitSequence(entries, input);
      if (sequence) return sequence;
    }
  }

  return containsBitSyntax(data) ? new UnsupportedSchemaMatcher() : undefined;
}

class ExactBitSchemaMatcher implements SchemaMatcher, BitLayout {
  public readonly terminal = false;

  public constructor(public readonly bits: number) {
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    if (!(value instanceof FrameBlob)) return bitInputInvalid(value);
    if (value.bitLength() < this.bits) {
      return matchFailure(
        Frame.error(`$!.insufficient-bits <${this.bits}@Bit> 0`),
      );
    }
    if (value.bitLength() > this.bits) {
      return matchFailure(
        Frame.error(`$!.unconsumed-bits ${value.bitLength() - this.bits}`),
      );
    }
    return matchSuccess(value);
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    _scope: CaptureScope,
    label: string,
  ): BitStep {
    return offset + this.bits > value.bitLength()
      ? Frame.error(`$!.insufficient-bits ${label} ${offset}`)
      : {
        evidence: value.sliceBits(offset, this.bits),
        end: offset + this.bits,
      };
  }

  public apply(schema: FrameList, value: Frame, origin: Frame): Frame {
    if (value instanceof FrameInt && value.data >= 0n) {
      const digits = value.data.toString(2);
      return digits.length > this.bits ||
          BigInt(this.bits) > REPETITION_TEXT_LIMIT
        ? Frame.error(`$!.bit-width ${this.bits}`)
        : new FrameBlob(`0b${digits.padStart(this.bits, "0")}`);
    }
    const result = this.match(schema, value, origin);
    return result.matched ? result.evidence : result.error;
  }

  public format(): string {
    return `<${this.bits}@Bit>`;
  }
}

class RemainderBitSchemaMatcher implements SchemaMatcher, BitLayout {
  public readonly bits = null;
  public readonly terminal = true;

  public apply(schema: FrameList, value: Frame, origin: Frame): Frame {
    if (value instanceof FrameInt && value.data >= 0n) {
      return new FrameBlob(`0b${value.data.toString(2)}`);
    }
    const result = this.match(schema, value, origin);
    return result.matched ? result.evidence : result.error;
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    return value instanceof FrameBlob
      ? matchSuccess(value)
      : bitInputInvalid(value);
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    _scope: CaptureScope,
    label: string,
  ): BitStep {
    const width = value.bitLength() - offset;
    return width <= 0
      ? Frame.error(`$!.insufficient-bits ${label} ${offset}`)
      : { evidence: value.sliceBits(offset, width), end: value.bitLength() };
  }

  public format(): string {
    return "<[@Bit]>";
  }
}

/**
 * A constant field, such as a start marker or an opcode, written as a schema
 * of blobs (`<0xa>`, `<op.x>`). It consumes the width of whichever blob it
 * matches, compares bits rather than spellings (`0b1010` matches `0xa`), and
 * answers the blob as declared. Only built for a capture inside a bit layout;
 * a bare `<0xa>` stays an enumeration.
 */
class LiteralBitLayout implements BitLayout {
  public readonly terminal = false;

  public constructor(private readonly literals: FrameBlob[]) {
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    _scope: CaptureScope,
    label: string,
  ): BitStep {
    for (const literal of this.literals) {
      if (sameBits(value, offset, literal)) {
        return { evidence: literal, end: offset + literal.bitLength() };
      }
    }
    const mismatch = Frame.error(`$!.bit-literal-mismatch ${label} ${offset}`);
    openingMismatches.set(mismatch, offset);
    return mismatch;
  }

  public matches(part: FrameBlob): boolean {
    return this.literals.some((literal) =>
      literal.bitLength() === part.bitLength() && sameBits(part, 0, literal)
    );
  }

  public format(): string {
    return `<${this.literals.map((literal) => literal.toString()).join(", ")}>`;
  }
}

/**
 * Each literal mismatch, or choice none of whose options opened, and the
 * cursor it happened at. A mismatch at the
 * cursor an option started from means the option did not apply. Any other
 * failure means the option's opening field matched and a later one failed,
 * which is the reason an ordered choice reports when no option matches.
 */
const openingMismatches = new WeakMap<Frame, number>();

function sameBits(
  value: FrameBlob,
  offset: number,
  literal: FrameBlob,
): boolean {
  const width = literal.bitLength();
  return offset + width <= value.bitLength() &&
    value.sliceBits(offset, width).unsignedValue() === literal.unsignedValue();
}

/**
 * Ordered choice among bit layouts (`<parse-x, parse-y, parse-data>`): the
 * first option that matches at the cursor wins, and no later failure revisits
 * the choice. A failed option's captures are discarded with it.
 */
class AlternativeBitLayout implements BitLayout {
  public readonly terminal: boolean;

  public constructor(private readonly options: BitLayout[]) {
    this.terminal = options.some((option) => option.terminal);
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    scope: CaptureScope,
    label: string,
  ): BitStep {
    let reason: Frame | undefined;
    for (const option of this.options) {
      const trial = new Map(scope);
      const step = option.matchAt(value, offset, trial, label);
      if (step instanceof Frame) {
        if (openingMismatches.get(step) !== offset) reason ??= step;
        continue;
      }
      for (const [name, part] of trial) scope.set(name, part);
      return step;
    }
    if (reason) return reason;
    // No option got past its opening field, so to an enclosing choice this
    // choice did not apply either.
    const none = Frame.error(`$!.no-bit-alternative ${label} ${offset}`);
    openingMismatches.set(none, offset);
    return none;
  }

  public format(): string {
    return `<${this.options.map((option) => option.format()).join(", ")}>`;
  }
}

/**
 * `<[element]>` repeats a bit layout until the input ends, answering the list
 * of each element's evidence; `<[@Bit]>` remains the plain remainder. Every
 * element must consume at least one bit, and a mismatch fails the whole
 * repetition rather than stopping early, since the input must be consumed.
 */
class RepetitionBitLayout implements SchemaMatcher, BitLayout {
  public readonly terminal = true;

  public constructor(private readonly element: BitLayout) {
  }

  public match(_schema: FrameList, value: Frame, _origin: Frame): MatchResult {
    return matchWhole(this, value, "");
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    scope: CaptureScope,
    label: string,
  ): BitStep {
    const items: Frame[] = [];
    let at = offset;
    while (at < value.bitLength()) {
      const step = this.element.matchAt(
        value,
        at,
        scope,
        `${label}.${items.length}`,
      );
      if (step instanceof Frame) return step;
      if (step.end <= at) {
        return Frame.error(`$!.empty-repetition ${label} ${at}`);
      }
      items.push(step.evidence);
      at = step.end;
    }
    return { evidence: new FrameArray(items), end: at };
  }

  /** Construction would have to choose elements; it is refused, not guessed. */
  public construct(_value: Frame): Frame {
    return Frame.error(`$!.unsupported-bit-construct ${this.format()}`);
  }

  public format(): string {
    return `<[${this.element.format()}]>`;
  }
}

class BitSequenceSchemaMatcher implements SchemaMatcher, BitLayout {
  public readonly terminal: boolean;

  public constructor(private readonly captures: BitCapture[]) {
    const last = captures.at(-1);
    this.terminal = last?.layout?.terminal ?? last?.bits === null;
  }

  public match(
    _schema: FrameList,
    value: Frame,
    _origin: Frame,
  ): MatchResult {
    return matchWhole(this, value, "");
  }

  public matchAt(
    value: FrameBlob,
    offset: number,
    scope: CaptureScope,
    _label: string,
  ): BitStep {
    let at = offset;
    const evidence = new FrameArray([]);
    for (const capture of this.captures) {
      let part: Frame;
      if (capture.layout) {
        const step = capture.layout.matchAt(
          value,
          at,
          scope,
          `.${capture.name}`,
        );
        if (step instanceof Frame) return step;
        part = step.evidence;
        at = step.end;
      } else {
        const resolved = this.width(capture, scopeFrame(scope));
        if (resolved instanceof Frame) return resolved;
        const width = resolved ?? value.bitLength() - at;
        if (width <= 0 || at + width > value.bitLength()) {
          return Frame.error(`$!.insufficient-bits .${capture.name} ${at}`);
        }
        part = value.sliceBits(at, width);
        at += width;
      }
      evidence.set(capture.name, part);
      scope.set(capture.name, part);
    }
    return { evidence, end: at };
  }

  private width(capture: BitCapture, evidence: Frame): number | null | Frame {
    if (!(capture.bits instanceof Frame)) return capture.bits;
    const answer = callSchemaPredicate(capture.bits, evidence);
    if (answer.is.error) return missingCapture(capture.name, answer, evidence);
    const matcher = answer.isSchema() ? answer.compiledMatcher() : undefined;
    const width = matcher instanceof ExactBitSchemaMatcher ||
        matcher instanceof RemainderBitSchemaMatcher
      ? matcher.bits
      : undefined;
    if (width === null && capture !== this.captures.at(-1)) {
      return Frame.error(`$!.invalid-remainder-position .${capture.name}`);
    }
    return width === undefined
      ? Frame.error(`$!.invalid-bit-capture .${capture.name}`)
      : width;
  }

  public construct(value: Frame): Frame {
    const evidence = new FrameArray([]);
    const parts: Frame[] = [];
    for (const capture of this.captures) {
      const binding = value.resolve_here(capture.name, Frame.nil);
      if (!binding) return Frame.error(`$!.property-missing .${capture.name}`);
      const part = binding.value;
      if (part.is.error) return part;
      if (capture.layout && !(capture.layout instanceof LiteralBitLayout)) {
        return Frame.error(`$!.unsupported-bit-construct .${capture.name}`);
      }
      if (!(part instanceof FrameBlob)) {
        return Frame.error(`$!.bit-input-invalid ${part.toString()}`);
      }
      if (capture.layout instanceof LiteralBitLayout) {
        if (!capture.layout.matches(part)) {
          return Frame.error(`$!.bit-literal-mismatch .${capture.name} 0`);
        }
      } else {
        const width = this.width(capture, evidence);
        if (width instanceof Frame) return width;
        if (width !== null && part.bitLength() !== width) {
          return Frame.error(`$!.bit-width ${width}`);
        }
      }
      parts.push(part);
      evidence.set(capture.name, part);
    }
    return new FrameArray(parts);
  }

  public format(): string {
    return `<[${
      this.captures.map((capture) =>
        `.${capture.name} ${
          capture.layout
            ? capture.layout.format()
            : capture.bits instanceof Frame
            ? capture.bits.toString()
            : capture.bits == null
            ? "<[@Bit]>"
            : `<${capture.bits}@Bit>`
        };`
      ).join(" ")
    }]>`;
  }
}

/**
 * A deferred capture's name lookup starts at the capture scope, so a missing
 * name that is not bound outside the layout either is reported against that
 * scope (`$!.name-missing “$:FrameArray.N.width”`), with an id that changes run
 * to run. Name the field being sized and the capture it needed instead.
 */
function missingCapture(field: string, error: Frame, scope: Frame): Frame {
  const prefix = `$!.name-missing “${scope.id}.`;
  const text = error.toString();
  if (!text.startsWith(prefix)) return error;
  const name = text.slice(prefix.length).split("”")[0];
  return Frame.error(`$!.capture-missing .${field} ${name}`);
}

function isNamedCapture(entry: Frame): boolean {
  const terms = entry instanceof FrameList
    ? entry.asArray().map(unwrapSchemaSyntax)
    : [];
  return terms.length === 2 && terms[0] instanceof FrameName;
}

/**
 * The bit layout a schema term denotes when used inside a bit layout: a bit
 * matcher as compiled, a schema of blobs as a literal field, or a schema of
 * such schemas as an ordered choice. Undefined when the term denotes none, and
 * an error when evaluating it failed.
 */
function bitLayoutOf(
  term: Frame,
  input?: EvaluationInput,
): BitLayout | Frame | undefined {
  const syntax = unwrapSchemaSyntax(term);
  const value = input === undefined
    ? syntax
    : evaluateSchemaTerm(syntax, input);
  if (value.is.error) return value;
  return layoutOfSchema(value.referent(), new Set());
}

function layoutOfSchema(
  schema: Frame,
  path: Set<Frame>,
): BitLayout | undefined {
  if (!schema.isSchema() || path.has(schema)) return undefined;
  const matcher = schema.compiledMatcher();
  if (isBitLayout(matcher)) return matcher;
  if (!(matcher instanceof EnumerationSchemaMatcher)) return undefined;
  const candidates = schema.asArray().map((candidate) => candidate.referent());
  if (candidates.length === 0) return undefined;
  if (candidates.every((candidate) => candidate instanceof FrameBlob)) {
    return new LiteralBitLayout(candidates as FrameBlob[]);
  }
  const options: BitLayout[] = [];
  const inner = new Set(path).add(schema);
  for (const candidate of candidates) {
    const option = candidate instanceof FrameBlob
      ? new LiteralBitLayout([candidate])
      : layoutOfSchema(candidate, inner);
    if (!option) return undefined;
    options.push(option);
  }
  return options.length === 1 ? options[0] : new AlternativeBitLayout(options);
}

function compileBitSequence(
  entries: Frame[],
  input?: EvaluationInput,
): SchemaMatcher | Frame | undefined {
  if (entries.length === 0) return undefined;
  const captures: BitCapture[] = [];
  const names = new Set<string>();
  // A sequence is a bit layout when it spells bit syntax or one of its
  // captures evaluates to a bit layout, such as a literal field (#311).
  // Otherwise it stays an ordinary enumeration, as before.
  const syntax = containsBitSyntax(entries);
  let layouts = false;
  const refuse = (matcher: SchemaMatcher | Frame) =>
    syntax || layouts || entries.some((entry) => layoutCapture(entry, input))
      ? matcher
      : undefined;

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index];
    const terms = entry instanceof FrameList
      ? entry.asArray().map(unwrapSchemaSyntax)
      : [];
    if (
      terms.length !== 2 || !(terms[0] instanceof FrameName) ||
      !(isSchemaFrame(terms[1]) || terms[1].isClosure())
    ) {
      return refuse(new UnsupportedSchemaMatcher());
    }

    const capture = terms[1];
    const deferred = capture.isClosure() ? capture.in(input) : undefined;
    if (deferred && schemaPredicateHasEffect(deferred)) {
      return refuse(
        new UnsupportedSchemaMatcher("$!.schema-predicate-effect"),
      );
    }
    const compiled = deferred ??
      compileBitSchemaMatcher(capture.asArray(), input);
    if (compiled instanceof Frame && !deferred) return compiled;
    // A capture written without bit syntax, such as `<op.x>`, may still
    // denote a literal field or a choice of layouts once evaluated.
    const nested = deferred || compiled !== undefined
      ? compiled
      : bitLayoutOf(capture, input);
    if (nested instanceof Frame && !deferred) return refuse(nested);
    if (
      !deferred &&
      (nested === undefined || !isBitLayout(nested as SchemaMatcher))
    ) {
      return refuse(new UnsupportedSchemaMatcher());
    }
    if (!deferred) layouts = true;

    const name = terms[0].source;
    if (names.has(name)) {
      return new UnsupportedSchemaMatcher(`$!.duplicate-capture-name .${name}`);
    }
    names.add(name);

    if (deferred) {
      captures.push({ name, bits: deferred });
      continue;
    }
    const layout = nested as BitLayout;
    if (layout.terminal && index !== entries.length - 1) {
      return new UnsupportedSchemaMatcher(
        `$!.invalid-remainder-position .${name}`,
      );
    }
    if (layout instanceof RemainderBitSchemaMatcher) {
      captures.push({ name, bits: null });
    } else if (layout instanceof ExactBitSchemaMatcher) {
      captures.push({ name, bits: layout.bits });
    } else {
      captures.push({ name, bits: null, layout });
    }
  }

  return syntax || layouts ? new BitSequenceSchemaMatcher(captures) : undefined;
}

/** Whether a sequence entry is a named capture of an evaluated bit layout. */
function layoutCapture(entry: Frame, input?: EvaluationInput): boolean {
  if (!isNamedCapture(entry)) return false;
  const capture = unwrapSchemaSyntax((entry as FrameList).asArray()[1]);
  if (!isSchemaFrame(capture)) return false;
  const layout = bitLayoutOf(capture, input);
  return layout !== undefined && !(layout instanceof Frame);
}

function bitUnit(
  frame: Frame,
  input?: EvaluationInput,
): number | Frame | undefined {
  if (!(frame instanceof FrameAlias)) return undefined;
  if (frame.toString() === "@Bit") return 1;
  if (frame.toString() !== "@Byte") return undefined;
  if (input === undefined) return 8;
  const binding = FrameSymbol.for("Byte").lookupIn(EvaluationScope.from(input))
    ?.value;
  if (binding === undefined) return 8;
  if (binding.is.error) return binding;
  const matcher = binding.isSchema() ? binding.compiledMatcher() : undefined;
  return matcher instanceof ExactBitSchemaMatcher
    ? matcher.bits
    : Frame.error("$!.invalid-bit-unit @Byte");
}

function isBitAlias(frame: Frame): boolean {
  return frame instanceof FrameAlias &&
    ["@Bit", "@Byte"].includes(frame.toString());
}

function containsBitSyntax(frames: Frame[]): boolean {
  return frames.some((frame) => {
    if (isBitAlias(frame)) return true;
    return frame instanceof FrameList && containsBitSyntax(frame.asArray());
  });
}
