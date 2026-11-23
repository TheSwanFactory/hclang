import { declaredChain, Frame } from "./frame.ts";
import { FrameArray } from "./frame-array.ts";
import { FrameExpr, FrameScoped } from "./frame-expr.ts";
import { FrameGroup } from "./frame-group.ts";
import { FrameHandle } from "./frame-handle.ts";
import { FrameLazy } from "./frame-lazy.ts";
import { FrameSymbol, type NameScope } from "./frame-symbol.ts";
import { BoundMethod, type ReceiverState } from "./bound-method.ts";
import type { EvaluationScope } from "./evaluation-scope.ts";
import { touchesIdentity } from "./effect-marker.ts";
import { effectSubscribersOf } from "./effect-registry.ts";
import {
  AccessRecord,
  LookupProbe,
  withAccessRecord,
  withLookupProbe,
} from "./reference-tracking.ts";

/**
 * The potential access footprint of an event, read off its code before it runs
 * (occurrence/figure 015.23a §3: typing grants authority, tracking establishes
 * concrete references).
 *
 * An event is a callable Frame, a `BoundMethod` or a bound `FrameLazy`, with
 * an argument. HC code is Frames, so the body can be walked as data: each
 * name in it is graded by the one effect rule, `touchesIdentity`, and resolved
 * against the scope the call would run in (`scopeForCall`) to the identity it
 * denotes *now*. A bare name is read by lookup itself (`FrameSymbol.lookupIn`)
 * under a lookup probe (`withLookupProbe`), so its reads are exactly the
 * frames lookup consults, hit or miss, which are the reads the event guard
 * checks (#527). The walk answers two sets of identities and a list of names:
 *
 * - **writes**: identities the event may mutate. A write can land on an
 *   identity only through a key spelled with the marker or by registering an
 *   arrow `managed -> callback` on it, so the walk marks as writable the left
 *   operand of every arrow, the referent of every marked name it meets, the
 *   receiver of a
 *   mutating method reached through a mutable handle, the owner of every
 *   `@name` alias write, and, through a marked key, each identity held under
 *   a marked key of a writable identity. A local declaration spelled with
 *   the marker, `.b_ x`, mints a mutable handle on whatever `x` denotes, so
 *   that referent is writable too.
 * - **reads**: identities the event may observe. Every resolved referent is
 *   readable, with all identities reachable from it through its members and
 *   declared parent, and so is every frame a name was looked up in, the one
 *   it was found in and the ones it missed in before, since the runtime
 *   counts a keyed lookup, hit or miss, as a read of that frame.
 * - **unresolved**: names the walk could not resolve to a value, and terms
 *   whose referent is not a name path (an import, a resource, a call result
 *   that a marked name is then applied to). An event with any is *opaque*:
 *   its footprint is unknown, and a dispatcher must treat it as touching
 *   everything.
 *
 * The walk is conservative by construction: it over-approximates (a marked
 * name is counted as a write whether or not the body writes through it; a
 * functional update's nested members are counted at the shared originals a
 * copy-on-write would fork) and refuses rather than guesses. It is not an
 * alias analysis, and it does not follow a value the event constructs at
 * run time. What it does establish is a footprint the runtime can check an
 * event's actual accesses against (`reference-tracking.ts`), which is the
 * relationship 015.24c asks for between permission and actual access.
 *
 * Code the event may run that is not reached by name is handled so that it
 * cannot be admitted silently: a closure handed in as the argument is walked
 * where it was written (`.apply {_ ()}`), and so is every callback an arrow
 * `x -> callback` registered on an identity the event may write, since a
 * committed write invokes it; a `BoundMethod` reached as the argument or as
 * a value makes the footprint opaque, since its receiver is not visible from
 * here. Code reached only through a value the walk does not inspect is the
 * known remaining gap: a closure held as an element of an aggregate and
 * called by iterating it (`fns & {_ ()}`), or handed in inside a data
 * argument (`_ & {_ ()}`). Such a call is not walked, so the footprint misses
 * its accesses; under `footprint` dispatch the guard installed on the event
 * refuses the first such access before it happens (`event-dispatch.ts`),
 * which is what keeps the under-inference from admitting an interference.
 *
 * @module
 */

/** The identities an event may read or write, or the reason it is unknown. */
export interface PotentialFootprint {
  readonly reads: ReadonlySet<Frame>;
  readonly writes: ReadonlySet<Frame>;
  /** Names and terms the walk could not resolve; non-empty means opaque. */
  readonly unresolved: readonly string[];
}

/** Whether a footprint is unknown, so it must be assumed to touch everything. */
export const isOpaque = (footprint: PotentialFootprint): boolean =>
  footprint.unresolved.length > 0;

/** Whether two footprints could interfere: a write in one meets the other. */
export function footprintsConflict(
  left: PotentialFootprint,
  right: PotentialFootprint,
): boolean {
  if (isOpaque(left) || isOpaque(right)) return true;
  for (const frame of left.writes) {
    if (right.writes.has(frame) || right.reads.has(frame)) return true;
  }
  for (const frame of right.writes) {
    if (left.reads.has(frame)) return true;
  }
  return false;
}

/** Where a name was found: the frame holding the binding, and its value. */
interface Resolution {
  readonly owner: Frame;
  readonly value: Frame;
}

/** The walk's accumulators and the guards that bound it. */
class Walk {
  public readonly reads = new Set<Frame>();
  public readonly writes = new Set<Frame>();
  public readonly unresolved: string[] = [];
  /** Bodies already walked, by closure and receiver, so recursion ends. */
  private readonly walked = new Set<string>();
  /**
   * Frames the walk itself made to stand for the call (`scopeForCall`): the
   * call frame the event will make afresh when it runs, never shared state.
   */
  public readonly scratch = new AccessRecord();
  /**
   * Stands for the scope a dotted read happens in, which the handle that read
   * answers records (`FrameHandle` read context). Lookup through such a handle
   * asks only whether there is one, never for names in it.
   */
  public readonly readScope = withAccessRecord(
    this.scratch,
    () => new Frame(),
  );
  private readonly standIns = new Set<Frame>();

  /** Whether a frame is state the event could share with another. */
  private shared(target: Frame): boolean {
    return isState(target) && !this.scratch.created.has(target);
  }

  /** Reads the identity and everything reachable from it. */
  public read(frame: Frame): void {
    const target = unwrap(frame);
    if (!isState(target) || this.reads.has(target)) return;
    if (this.scratch.created.has(target)) {
      // A stand-in (a functional update's receiver copy) is not shared, but
      // the members it shares with its original are.
      if (this.standIns.has(target)) return;
      this.standIns.add(target);
    } else {
      this.reads.add(target);
    }
    for (const member of membersOf(target)) this.read(member);
  }

  /** Reads one binding of a frame: the frame, not what it holds. */
  public readBinding(frame: Frame): void {
    const target = unwrap(frame);
    if (this.shared(target)) this.reads.add(target);
  }

  /** Writes one binding of a frame: the frame, not what it holds. */
  public writeBinding(frame: Frame): void {
    const target = unwrap(frame);
    if (!this.shared(target)) return;
    this.reads.add(target);
    this.writes.add(target);
  }

  public write(frame: Frame): void {
    const target = unwrap(frame);
    if (!this.shared(target)) return;
    this.read(target);
    if (this.writes.has(target)) return;
    this.writes.add(target);
    // A marked key on a writable identity hands out a mutable handle on the
    // member it holds, so a write may continue through it.
    for (const [key, member] of target.meta_pairs()) {
      if (touchesIdentity(key)) this.write(member);
    }
    // A committed write to a managed value invokes the callbacks an arrow
    // `target -> callback` registered on it, so their effects are this
    // event's: each is walked where it was written, as a closure argument is.
    for (const callback of effectSubscribersOf(target)) {
      walkCallable(this, callback, `${target.className()} ->`);
    }
  }

  public refuse(what: string): void {
    this.unresolved.push(what);
  }

  public firstWalk(body: FrameLazy, receiver: Frame | undefined): boolean {
    const key = `${body.id}|${receiver?.id ?? ""}`;
    if (this.walked.has(key)) return false;
    this.walked.add(key);
    return true;
  }
}

/** A code body with the frames its names resolve in, receiver first. */
interface Site {
  readonly frames: readonly Frame[];
  readonly receiver?: Frame;
  /** Whether a write to the receiver lands on it rather than on a copy. */
  readonly receiverMutable: boolean;
  /**
   * Whether the body runs as a functional update: every write it makes lands
   * on a copy-on-write fork, or meets `$!.copy-on-write-boundary`, so no
   * shared identity is written through it.
   */
  readonly isolated: boolean;
  readonly argument: Frame;
  /** Whether the argument came through a mutable handle. */
  readonly argumentMutable: boolean;
  /** Names the body declared so far, with what each may denote. */
  readonly locals: Map<string, Referents | undefined>;
  /**
   * The layers and receiver a bare name reads through, as `FrameSymbol.in`
   * would read it in this body: the scope the call builds (`scopeForCall`).
   */
  readonly lookup: NameScope;
  /**
   * The read scope the receiver's method was reached through, when the call
   * reads its receiver through a handle that records one
   * (`ReceiverState.lexicalContext`). Such a receiver layer is looked up on
   * the receiver and its declared parents only, never its own `up`.
   */
  readonly receiverContext?: Frame;
}

/**
 * The scope a call of a closure the walk reaches by name would run in, with
 * the receiver state given when it runs as a method, made under the walk's
 * scratch record as the top-level call scope is. The argument is not known
 * here, so it is nil.
 */
function nestedScope(
  walk: Walk,
  closure: FrameLazy,
  receiverState?: ReceiverState,
): EvaluationScope {
  return withAccessRecord(
    walk.scratch,
    () => closure.scopeForCall(Frame.nil, Frame.nil, receiverState),
  );
}

/**
 * What a path denotes so far: the identities, and whether the path holds
 * mutation authority over them. A marked name and an element index hand out
 * the identity itself; an unmarked name hands out an immutable handle, through
 * which a mutating method is a functional update.
 */
interface Referents {
  readonly frames: Frame[];
  readonly mutable: boolean;
}

const fresh: Referents = { frames: [], mutable: false };

/**
 * The potential footprint of calling `target` with `argument`.
 *
 * `target` is a `BoundMethod` or a `FrameLazy`; anything else has no code to
 * walk and answers an opaque footprint naming the target.
 */
export function potentialFootprint(
  target: Frame,
  argument: Frame = Frame.nil,
): PotentialFootprint {
  const walk = new Walk();
  walk.read(argument);
  const argumentMutable = argument instanceof FrameHandle &&
    argument.isMutable();
  if (target instanceof BoundMethod) {
    const scope = withAccessRecord(
      walk.scratch,
      () => target.scopeForCall(argument),
    );
    if (scope instanceof Frame) {
      // The call is refused before the body, so it touches nothing.
      return finish(walk);
    }
    const receiver = scope.receiverState?.receiver ?? target.receiverFrame();
    const receiverMutable = target.isMutating() && target.hasMutableReceiver();
    if (receiverMutable) walk.write(receiver);
    else walk.read(receiver);
    walkBody(walk, target.methodBody(), {
      frames: scope.lookupFrames(),
      receiver,
      receiverMutable,
      isolated: scope.receiverState?.copyOnWrite !== undefined,
      argument,
      argumentMutable,
      locals: new Map(),
      lookup: scope,
      receiverContext: scope.receiverState?.lexicalContext,
    });
  } else if (target instanceof FrameLazy) {
    const scope = withAccessRecord(
      walk.scratch,
      () => target.scopeForCall(argument),
    );
    walkBody(walk, target, {
      frames: scope.lookupFrames(),
      receiverMutable: false,
      isolated: false,
      argument,
      argumentMutable,
      locals: new Map(),
      lookup: scope,
    });
  } else {
    walk.refuse(`target ${target.className()}`);
  }
  return finish(walk);
}

const finish = (walk: Walk): PotentialFootprint => ({
  reads: walk.reads,
  writes: walk.writes,
  unresolved: walk.unresolved,
});

/** A handle is transparent; a walk's compound atom is its term. */
function unwrap(frame: Frame): Frame {
  if (frame instanceof FrameHandle) return frame.unwrap();
  if (frame instanceof FrameScoped) return unwrap(frame.term);
  return frame;
}

/**
 * Whether a frame is state an event could share: an aggregate, which owns
 * identity, or a plain scope frame, which holds bindings a `@name` can write.
 * Atoms, closures and parsed expressions are values or code, never state.
 * The dispatcher applies the same test to an event's actual accesses, so a
 * write to a plain scope is as visible after the fact as one to an aggregate.
 */
export function isState(frame: Frame): boolean {
  if (frame.is.missing || frame.is.void) return false;
  return frame.ownsIdentity() || frame.className() === "Frame";
}

/** The identities a frame holds: its bindings, elements, and declared parent. */
function membersOf(frame: Frame): Frame[] {
  const members: Frame[] = frame.meta_pairs().map(([, value]) => value);
  if (frame instanceof FrameArray) members.push(...frame.asArray());
  if (frame.hasDeclaredParent()) members.push(frame.parent);
  return members;
}

/** Walks a closure body once per receiver, each statement from a fresh path. */
function walkBody(walk: Walk, body: FrameLazy, site: Site): void {
  if (!walk.firstWalk(body, site.receiver)) return;
  for (const term of body.asArray()) walkStatement(walk, term, site);
}

/**
 * Walks one statement. A declaration `.k v` records `k` as a local denoting
 * what `v` denotes and, when `k` is marked, makes those referents writable:
 * the new name is a mutable handle on them.
 */
function walkStatement(walk: Walk, term: Frame, site: Site): void {
  const items = term instanceof FrameExpr && term.isPlainExpression()
    ? term.asArray()
    : [term];
  const head = items[0] === undefined ? undefined : plainAtom(items[0]);
  if (items.length >= 2 && head?.isName() && isDeclaration(head.source)) {
    const referents = walkPath(walk, items.slice(1), site);
    const mutable = touchesIdentity(head.source);
    if (mutable) {
      for (const referent of referents?.frames ?? []) walk.write(referent);
      if (referents === undefined) walk.refuse(`.${head.source} <unknown>`);
    }
    site.locals.set(
      stripMarker(head.source),
      referents && { frames: referents.frames, mutable },
    );
    return;
  }
  walkPath(walk, items, site);
}

const isDeclaration = (source: string): boolean =>
  !/^\.*$/.test(source) && source !== "^";

const stripMarker = (key: string): string =>
  touchesIdentity(key) ? key.slice(0, -1) : key;

/**
 * What a path walk carries from one term to the next: what the path denotes
 * so far, undefined once that is unknown, and whether a term on the path has
 * been refused.
 */
interface PathCursor {
  current: Referents | undefined;
  refused: boolean;
}

/**
 * Refuses the path at `what`. Once a term has been refused, the path is
 * already opaque, so only the first refusal is recorded: later names applied
 * to the unknown value add nothing.
 */
function refusePath(walk: Walk, cursor: PathCursor, what: string): void {
  if (!cursor.refused) walk.refuse(what);
  cursor.refused = true;
  cursor.current = undefined;
}

/**
 * Walks the terms of one expression left to right, carrying what the path so
 * far denotes, as evaluation carries its accumulator. Answers what the whole
 * path denotes, or undefined when that is not known.
 */
function walkPath(
  walk: Walk,
  terms: readonly Frame[],
  site: Site,
): Referents | undefined {
  const cursor: PathCursor = { current: fresh, refused: false };
  for (let index = 0; index < terms.length; index++) {
    const term = plainAtom(terms[index]);
    const next = terms[index + 1] === undefined
      ? undefined
      : plainAtom(terms[index + 1]);
    // A mutable referent hands out the identity itself. When the next term
    // reads a member through it, that member's own spelling decides what is
    // handed out next; otherwise the handle is used or handed on whole, so
    // the referent may be written.
    const handedOn = !(next !== undefined && next.isName());
    if (term.is.operator === true) {
      stepOperator(walk, cursor, term);
    } else if (term.isName()) {
      stepName(walk, cursor, term.source, site, handedOn);
    } else if (term.className() === "FrameAlias") {
      stepAlias(walk, cursor, term, site);
    } else if (term instanceof FrameSymbol) {
      stepSymbol(walk, cursor, term, site, handedOn);
    } else if (term instanceof FrameLazy) {
      stepClosure(walk, cursor, term, site);
    } else if (term instanceof FrameGroup) {
      stepGroup(walk, cursor, term, site);
    } else if (term instanceof FrameExpr && term.isPlainExpression()) {
      stepTight(walk, cursor, term, site);
    } else if (term instanceof FrameArray || term instanceof FrameExpr) {
      stepAggregate(walk, cursor, term, site);
    } else if (isOpaqueTerm(term)) {
      refusePath(walk, cursor, term.className());
    } else {
      // An atom (a count, a string, an echo): a value, not a path.
      cursor.current = fresh;
    }
  }
  return cursor.current;
}

/** An operator term: it answers a value no name holds. */
function stepOperator(walk: Walk, cursor: PathCursor, term: Frame): void {
  // An arrow `managed -> callback` registers on its left operand's
  // referent, which changes what every later write of it invokes, so it
  // is a write of that referent, whatever the handle's authority.
  if (isArrow(term) && cursor.current !== undefined) {
    for (const frame of cursor.current.frames) walk.write(frame);
  }
  // An operator combines its operands into a value no name holds.
  cursor.current = cursor.refused ? undefined : fresh;
}

/** A dotted name `.k`, applied to what the path denotes so far. */
function stepName(
  walk: Walk,
  cursor: PathCursor,
  source: string,
  site: Site,
  handedOn: boolean,
): void {
  if (cursor.current === undefined) {
    if (touchesIdentity(source)) {
      refusePath(walk, cursor, `.${source} <unknown>`);
    }
    return;
  }
  cursor.current = walkName(walk, source, cursor.current, handedOn, site);
}

/** An alias `@name`, a write to the binding it names. */
function stepAlias(
  walk: Walk,
  cursor: PathCursor,
  term: Frame,
  site: Site,
): void {
  cursor.current = walkAlias(walk, term.toString().slice(1), site);
  if (cursor.current === undefined) cursor.refused = true;
}

/** A bare name, which starts the path at what it denotes. */
function stepSymbol(
  walk: Walk,
  cursor: PathCursor,
  term: FrameSymbol,
  site: Site,
  handedOn: boolean,
): void {
  cursor.current = walkSymbol(walk, term, site, handedOn);
  if (cursor.current === undefined) cursor.refused = true;
}

/** A closure literal in this body, which runs in this body's scope. */
function stepClosure(
  walk: Walk,
  cursor: PathCursor,
  term: FrameLazy,
  site: Site,
): void {
  walkBody(walk, term, { ...site, locals: new Map(site.locals) });
  cursor.current = fresh;
}

/**
 * A group: `(e)` is the path `e`; `(a, b)` is a fresh tuple of walked values.
 */
function stepGroup(
  walk: Walk,
  cursor: PathCursor,
  term: FrameGroup,
  site: Site,
): void {
  const inner = term.asArray();
  if (inner.length === 1) {
    const only = plainAtom(inner[0]);
    cursor.current = walkPath(
      walk,
      only instanceof FrameExpr && only.isPlainExpression()
        ? only.asArray()
        : [only],
      site,
    );
    if (cursor.current === undefined) cursor.refused = true;
  } else {
    for (const each of inner) walkStatement(walk, each, site);
    cursor.current = fresh;
  }
}

/** A tight expression, terms that abut, which is one path of its own. */
function stepTight(
  walk: Walk,
  cursor: PathCursor,
  term: FrameExpr,
  site: Site,
): void {
  cursor.current = walkPath(walk, term.asArray(), site);
  if (cursor.current === undefined) cursor.refused = true;
}

/**
 * An aggregate literal or a nested expression: its terms are read; the
 * value is fresh.
 */
function stepAggregate(
  walk: Walk,
  cursor: PathCursor,
  term: FrameArray | FrameExpr,
  site: Site,
): void {
  for (const inner of term.asArray()) walkStatement(walk, inner, site);
  cursor.current = fresh;
}

/** Whether an operator term is the effect arrow `->` (`registerEffect`). */
const isArrow = (term: Frame): boolean =>
  (term as Frame & { operator?: string }).operator === "->";

/** A term through the parser's one-term wrappers and a walk's scope wrapper. */
function plainAtom(term: Frame): Frame {
  let atom = term instanceof FrameScoped ? term.term : term;
  while (
    atom instanceof FrameExpr && atom.isPlainExpression() && atom.size() === 1
  ) {
    atom = atom.asArray()[0];
    if (atom instanceof FrameScoped) atom = atom.term;
  }
  return atom;
}

/** Terms whose effect cannot be read off the code: they run or reach outside. */
const isOpaqueTerm = (term: Frame): boolean => {
  const name = term.className();
  return name === "FrameImport" || name === "FrameResource" ||
    name === "FrameURI";
};

/** A bare name: the argument, the receiver, a local, or a lookup. */
function walkSymbol(
  walk: Walk,
  term: FrameSymbol,
  site: Site,
  handedOn: boolean,
): Referents | undefined {
  const spelling = term.spelling();
  const name = term.className();
  if (name === "FrameArg" || name === "FrameParam") {
    if (spelling === "_") {
      walkCallable(walk, site.argument, spelling);
      return { frames: [site.argument], mutable: site.argumentMutable };
    }
    if (spelling === "_^" && site.receiver) {
      return { frames: [site.receiver], mutable: site.receiverMutable };
    }
    walk.refuse(spelling);
    return undefined;
  }
  const local = stripMarker(spelling);
  if (site.locals.has(local)) {
    const referents = site.locals.get(local);
    if (referents === undefined) {
      walk.refuse(spelling);
      return undefined;
    }
    const mutable = referents.mutable && touchesIdentity(spelling) &&
      !site.isolated;
    if (mutable && handedOn) {
      for (const referent of referents.frames) walk.write(referent);
    }
    return { frames: referents.frames, mutable };
  }
  const lookup = nameLookup(term, site.lookup);
  for (const frame of lookup.consulted) walk.readBinding(frame);
  if (lookup.pattern) {
    // A pattern binding answered: the walk does not guess what it denotes.
    walk.refuse(`/pattern/ ${spelling}`);
    return undefined;
  }
  if (!lookup.found) {
    walk.refuse(spelling);
    return undefined;
  }
  // Lookup answered an error (`$!.is-private .x`): the name denotes that
  // value, and the read goes no further.
  if (lookup.found.value.is.error) return fresh;
  return walkReferent(walk, spelling, lookup.found, site, handedOn, true);
}

/** A dotted name applied to the path so far: a member, a parent, or a method. */
function walkName(
  walk: Walk,
  source: string,
  current: Referents,
  handedOn: boolean,
  site: Site,
): Referents | undefined {
  if (/^\.*$/.test(source)) {
    // The parameter ladder reads the call's own parameters, not state.
    return fresh;
  }
  if (source === "^") {
    if (current.frames.length === 0 && site.receiver) {
      // Method-position `.^` re-parents the receiver.
      if (site.receiverMutable) walk.write(site.receiver);
      return fresh;
    }
    return {
      frames: current.frames.flatMap((frame) =>
        frame.hasDeclaredParent() ? [frame.parent] : []
      ),
      mutable: current.mutable,
    };
  }
  const frames: Frame[] = [];
  let mutable = false;
  for (const frame of current.frames) {
    const member = memberOf(frame, source);
    if (!member) {
      // A pattern binding answers a name no key spells, and rewrites the
      // matched value's source when it does (`MetaFrame.match_here`): the
      // walk does not follow it, so the event is opaque.
      if (patternAnswers(frame, source)) walk.refuse(`/pattern/ ${source}`);
      continue;
    }
    const receiver = unwrap(frame);
    const referents = walkReferent(
      walk,
      source,
      { owner: receiver, value: member },
      {
        ...site,
        receiver,
        receiverMutable: current.mutable,
        receiverContext: readContextOf(walk, frame, site),
      },
      handedOn,
      current.mutable,
    );
    frames.push(...referents.frames);
    mutable ||= referents.mutable;
  }
  return { frames, mutable };
}

/** `@name`: a write to the receiver's or the lexical owner's binding. */
function walkAlias(
  walk: Walk,
  key: string,
  site: Site,
): Referents | undefined {
  if (site.locals.has(key)) return site.locals.get(key) ?? fresh;
  if (site.receiver) {
    const onReceiver = resolveAlias(walk, key, [site.receiver]);
    if (onReceiver) {
      // The write lands on the receiver, or on its functional copy.
      if (site.receiverMutable && !site.isolated) {
        walk.writeBinding(onReceiver.owner);
      } else {
        walk.readBinding(onReceiver.owner);
      }
      return { frames: [onReceiver.value], mutable: false };
    }
  }
  const lexical = resolveAlias(
    walk,
    key,
    site.frames.filter((frame) =>
      frame !== site.argument && unwrap(frame) !== site.receiver
    ),
  );
  if (!lexical) {
    walk.refuse(`@${key}`);
    return undefined;
  }
  // Inside a functional update a lexical write meets the copy-on-write
  // boundary and is refused, so it writes nothing.
  if (site.isolated) walk.readBinding(lexical.owner);
  else walk.writeBinding(lexical.owner);
  return { frames: [lexical.value], mutable: false };
}

/**
 * What a resolved name contributes. Reading the binding reads its owner. A
 * marked name through a path that holds authority makes its referent writable
 * when it is handed on whole. A closure found by name is code that runs in
 * this event, so its body is walked too: as a method of the receiver when
 * found there, with the authority the path holds, otherwise where it was
 * written.
 */
function walkReferent(
  walk: Walk,
  spelling: string,
  found: Resolution,
  site: Site,
  handedOn: boolean,
  pathMutable: boolean,
): Referents {
  walk.readBinding(found.owner);
  const value = unwrap(found.value);
  const marked = touchesIdentity(spelling);
  if (value instanceof FrameLazy) {
    const onReceiver = site.receiver !== undefined &&
      isOnReceiverPath(site.receiver, found.owner);
    // A mutating method writes its receiver only through authority: a bare
    // sibling mutator in a functional call stays functional (class-support).
    const writes = marked && onReceiver && site.receiverMutable &&
      pathMutable && !site.isolated;
    if (writes) walk.write(site.receiver!);
    const receiver = onReceiver ? site.receiver : undefined;
    // The receiver state a call selects, over the receiver itself: a
    // functional update would read an instance copy holding the same
    // bindings, and the walk counts its accesses at the shared original.
    const lookup = nestedScope(
      walk,
      value,
      receiver && {
        receiver,
        mutable: writes,
        lexicalContext: site.receiverContext,
      },
    );
    walkBody(walk, value, {
      frames: receiver
        ? [receiver, ...lexicalChain(value)]
        : lexicalChain(value),
      lookup,
      receiver,
      receiverContext: receiver && site.receiverContext,
      receiverMutable: writes,
      // A mutating method reached without authority is a functional update.
      isolated: site.isolated || (marked && !writes),
      argument: Frame.nil,
      argumentMutable: false,
      locals: new Map(),
    });
    return fresh;
  }
  if (value instanceof BoundMethod) {
    // A method already bound to a receiver the walk cannot see from here.
    walk.refuse(`${spelling} ${value.className()}`);
    return fresh;
  }
  // An element index hands out the element itself; a marked key hands out a
  // mutable handle; an unmarked key an immutable one. Inside a functional
  // update every write is forked or refused, so nothing shared is written.
  const mutable = (Frame.isIndexKey(spelling) || marked) && !site.isolated;
  if (mutable && handedOn) walk.write(value);
  else walk.read(value);
  return { frames: [value], mutable };
}

/**
 * An argument that is code may be called by the body (`.apply {_ ()}`), so
 * its effects are the event's: a closure's body is walked where it was
 * written, and a bound method, whose receiver the walk cannot see from here,
 * makes the event opaque. An argument that is data contributes nothing.
 */
function walkCallable(walk: Walk, argument: Frame, spelling: string): void {
  const value = unwrap(argument);
  if (value instanceof FrameLazy) {
    walkBody(walk, value, {
      frames: lexicalChain(value),
      lookup: nestedScope(walk, value),
      receiverMutable: false,
      isolated: false,
      argument: Frame.nil,
      argumentMutable: false,
      locals: new Map(),
    });
  } else if (value instanceof BoundMethod) {
    walk.refuse(`${spelling} ${value.className()}`);
  }
}

/**
 * The read scope the handle a dotted method read goes through records, as
 * `BoundMethod.lexicalContext`, or undefined when that handle records none.
 * A handle the walk holds says so itself. The argument `_` is read through
 * `argumentRead`, a handle with no read scope, and the receiver `_^` is the
 * call's receiver layer. Any other aggregate was reached by a name, and that
 * read wraps it in a handle recording the scope it happened in
 * (`FrameSymbol.projectRead`); a read of any other value hands out the value.
 */
function readContextOf(
  walk: Walk,
  frame: Frame,
  site: Site,
): Frame | undefined {
  if (frame instanceof FrameHandle) return frame.readContextFrame();
  if (frame === site.argument) return undefined;
  if (frame === site.receiver) return site.receiverContext;
  return frame instanceof FrameArray ? walk.readScope : undefined;
}

/** Whether `owner` is the receiver itself or one of its declared parents. */
function isOnReceiverPath(receiver: Frame, owner: Frame): boolean {
  const start = unwrap(receiver);
  if (start.is.missing) return false;
  for (const frame of declaredChain(start)) {
    if (frame === owner) return true;
  }
  return false;
}

/** The frames a closure found by name resolves its own body's names in. */
function lexicalChain(closure: FrameLazy): Frame[] {
  const captured = closure.capturedScope();
  if (captured) return [...captured.lookupFrames()];
  return closure.up && !closure.up.is.missing ? [closure.up] : [];
}

/** The member `frame` holds under `key`: an element by index, else a field. */
function memberOf(frame: Frame, key: string): Frame | undefined {
  const target = unwrap(frame);
  if (Frame.isIndexKey(key)) {
    if (!(target instanceof FrameArray)) return undefined;
    const element = target.at(Number(key));
    return element.is.missing || element.is.error ? undefined : element;
  }
  if (target.is.missing) return undefined;
  for (const current of declaredChain(target)) {
    const binding = current.resolve_here(key, target);
    if (binding && !binding.value.is.error) return binding.value;
  }
  return undefined;
}

/**
 * Whether a pattern key (`/re/`) on `frame` or a declared parent matches
 * `key`. Such a binding has no HC spelling; a host can install one.
 */
function patternAnswers(frame: Frame, key: string): boolean {
  const start = unwrap(frame);
  if (start.is.missing) return false;
  for (const current of declaredChain(start)) {
    for (const pattern of current.meta_keys()) {
      const body = pattern.match(/\/(.*)\//);
      if (body && new RegExp(body[1]).test(key)) return true;
    }
  }
  return false;
}

/**
 * What one bare-name read consulted and found: the walk's name step, and the
 * seam the differential test checks against lookup (#527).
 *
 * The read is lookup itself (`FrameSymbol.lookupIn`), run under a lookup
 * probe, so `consulted` is every frame whose guarded `get_here` it ran, hit or
 * miss, less the frames it created. `found` is the first frame whose own
 * local lookup answered, unwrapped, with the raw value it answered; it is
 * absent when every layer missed. `pattern` says a pattern binding answered.
 */
export interface NameLookup {
  readonly consulted: readonly Frame[];
  readonly found?: Resolution;
  readonly pattern: boolean;
}

/** Reads `symbol` in `scope` the way the event will, and reports it. */
export function nameLookup(symbol: FrameSymbol, scope: NameScope): NameLookup {
  const probe = new LookupProbe();
  const read = withLookupProbe(probe, () => symbol.lookupIn(scope));
  const consulted = probe.sharedReads();
  const found = read && probe.owner && probe.answer
    ? { owner: unwrap(probe.owner), value: probe.answer }
    : undefined;
  return { consulted, found, pattern: probe.pattern };
}

/**
 * Finds the binding an `@name` writes: each frame in order, then its declared
 * parents, then the lexical `up` chain, and the globals last, approximating
 * `FrameAlias.find`. A handle resolves on its target and parents only (#400).
 * Bare names no longer use this; they are read by lookup itself
 * (`nameLookup`, #527).
 *
 * Every frame consulted is read, the ones that miss included: a miss is that
 * frame's answer that the name is absent there, and a binding added to it
 * would change where the name resolves.
 */
function resolveAlias(
  walk: Walk,
  key: string,
  frames: readonly Frame[],
): Resolution | undefined {
  const seen = new Set<Frame>();
  for (const frame of frames) {
    const found = resolveAliasThrough(
      walk,
      key,
      frame,
      seen,
      !(frame instanceof FrameHandle),
    );
    if (found) return found;
  }
  const globals = Frame.globals;
  if (globals && !globals.is.missing && !seen.has(globals)) {
    walk.readBinding(globals);
    const binding = globals.resolve_here(key, globals);
    if (binding && !binding.value.is.error) {
      return { owner: globals, value: binding.value };
    }
  }
  return undefined;
}

function resolveAliasThrough(
  walk: Walk,
  key: string,
  frame: Frame,
  seen: Set<Frame>,
  followLexical: boolean,
): Resolution | undefined {
  const target = unwrap(frame);
  if (target.is.missing || seen.has(target)) return undefined;
  seen.add(target);
  walk.readBinding(target);
  const binding = target.resolve_here(key, target);
  if (binding) {
    return binding.value.is.error
      ? undefined
      : { owner: target, value: binding.value };
  }
  if (target.hasDeclaredParent()) {
    const inherited = resolveAliasThrough(
      walk,
      key,
      target.parent,
      seen,
      false,
    );
    if (inherited) return inherited;
  }
  if (
    followLexical && target.up && !target.up.is.missing &&
    target.up !== Frame.globals
  ) {
    return resolveAliasThrough(walk, key, target.up, seen, true);
  }
  return undefined;
}
