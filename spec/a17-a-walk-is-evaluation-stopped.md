# A Walk Is Evaluation, Stopped

**Status:** Implemented in v0.29.0. Nothing remains open.\
**Issues:** #429, the walk; `a15`, which defined it, and `a16`, which left one
item open.\
**Supersedes:** `a15` §5's ruling that "a fold re-reads", and §6's bullet that
no atom reaches a bound closure's scope. `a16`'s one remaining item, "a re-read
closure has no captured scope", is closed here.

## The one sentence

A walk is not a projection of a closure, and not a capture of one: it is the
evaluator's own traversal of the closure's terms, stopped before each term's
last step, and a fold finishes it.

## Why the old reading had a limit

`a15` described the walk as a view of the closure and the fold as re-reading
that view as text. A view has no scope, so a re-read closure resolved its names
against the receiver alone, and `({f o.x} & {_}) | ()` failed to find `f`,
though `{f o.x} | ()` found it. The limit came from the description. In the
walk's code the closure's terms were already there, the same frames evaluation
uses. What the walk dropped was the one other thing evaluation holds at that
point: where each term would be evaluated.

## 1. An atom holds its term and where it would be evaluated

A walk of a bound closure holds each atom with the scope that closure was bound
in (`FrameLazy.bind`):

- **A word** (`FrameWord`) is a spelling, the declaration it resolves to, which
  `===` compares, and now that scope too.
- **A compound atom**, which is a tight expression, an aggregate or a closure
  written in the body, is held as a `FrameScoped`: the template's own term and
  the scope. So is an alias, `@a`, which resolves its binding where it is
  evaluated. A `FrameScoped` is transparent. It prints, compares and counts as
  the term, and it walks as the term does with the scope passed on, so a walk of
  a walk keeps resuming where the first closure was bound. Folding one directly
  resumes it in that scope too, so `(w .0) | ()` and `((w .0) & {_}) | ()`
  agree.

A closure that no evaluation has bound, such as a template built by a program,
holds no scope, and nor do its atoms.

```text
.o [.x 5]; ((({f o.x} & {_}) .1) & {“” _})   → [“o”, “.x”]
.o [.x 5]; (({f o.x} & {_}) .1).#            → 2
{4 + 5}.#                                    → 3      unchanged
```

## 2. A fold resumes evaluation

**Ruling: a fold over a walk resumes it, it does not re-read it.** A walk is
code when it holds a word or a held term. `closureFromAtoms` reassembles the
body, keeping each statement a statement as the parser does, and binds it where
the `|` is written, the fold's _site_. The body is then called with the
receiver, as before. Each held term is rebuilt as its own class, a fresh symbol
or a plumbing copy, so every check the evaluator makes on a term still holds,
and is registered with its scope. The evaluator consults that registry wherever
it evaluates a term, and a held term finishes evaluating in this order:

1. **The resumption's own frame**, a fresh one, where every declaration the body
   makes lands (`a16`'s order: the current child first).
2. **The receiver**, the argument of the call, so `{x + 1} | (.x 5)` is still
   `6`. It is kept whatever its identity, even when it is also one of the site's
   own layers, as `_` passed on is.
3. **The scope the term's closure was bound in**, read-only. The site is not
   consulted at all. That scope is also the enclosing one, so `__` and deeper
   argument levels, and carets, read the closure's chain rather than the site's.

A term with no scope, such as a punctuation word, a word from an unbound
template, or an operator, resolves at the site, as a name written there would.

```text
.o [.x 5]; .f {_ + 1}; ({f o.x} & {_}) | ()            → 6   (before: $!.name-missing f)
.a 1; .f {{a}}; ((f & {_}) .0) | ()                    → 1
.f {x + 1}; .g (f & {_}); [g | (.x 5), g | (.x 10)]    → [6, 11]   unchanged
.a 1; .p {a}; (p & {_}) | (.a 7)                       → 7   the receiver comes first
.p {x}; .o [.x 7]; {(p & {_}) | _} o                   → 7   the receiver is also a site layer
.mk {{__}}; .p (mk 7); [p 9, (p & {_}) | 9]            → [7, 7]   `__` is the closure's chain
.x 5; .f {x .<^>}; [f (), (f & {_}) | ()]               → both $!.schema-missing .x
```

**Ruling: each atom resumes in its own scope.** Atoms walked from two closures
and folded together never meet. Each finishes the evaluation its own closure
began, and the site's names do not shadow them:

```text
.a 1; .p {a}; .q ({.a 2; {a}} ());
  ([p, {+}, q] &| {_ & {_}}) | ()                      → 3   a from p is 1, a from q is 2
.a 1; .p {a}; {.a 5; (p & {_}) | ()} ()                → 1   not the site's 5
.b 10; .p {x + b}; {.b 20; (p & {_}) | (.x 1)} ()      → 11
```

This is hygiene. Scheme gets it with syntax objects, where an identifier carries
its lexical context and Racket gives each identifier a set of scopes. It needs
that machinery because Scheme environments are mutable, so sharing one between
code fragments lets one fragment's `set!` reach another's.

## 3. Why sharing a scope is safe: copy-on-write

Many words can hold one scope, and two streams can mix words from many scopes,
without any rule about who owns what. Copy-on-write is what makes that safe. A
write never lands on shared state: a functional update leaves the original
untouched at any depth (`lib/frames/CLAUDE.md`, Copy Contract), and every call
declares into a fresh frame of its own (#404). So a resumption declares into its
own frame and reads each scope through a live lookup that withholds write
authority (`LiveLookupContext`, the view a named import already gets). Sharing a
scope among words is then as unobservable as Figures sharing children.

```text
.a 1; .r (({.a 9; a} & {_}) | ()); [r, a]              → [9, 1]
.a 1; .f {.a 9; @a 10; a}; [f (), (f & {_}) | (), a]   → [10, 10, 1]
```

**Ruling: a resumed alias writes only the resumption's own frame.** An alias
that would reach the closure's scope is refused, `$!.resumed-write @a`, at top
level or nested in a held term, and nothing is written, neither the closure's
binding nor the site's:

```text
.a 1; .b 9; .f {@a b}
  [{.a 3; [f (), a]} (), a]                   → [[9, 3], 9]    a call writes f's a
  [{.a 3; [(f & {_}) | (), a]} (), a]         → [[$!.resumed-write @a, 3], 1]
```

A call exercises the closure's authority as the closure uses it. A walk can be
taken apart and recombined, so a resumed write would be authority the closure
never grants: `{@a b}` walked holds `@a`, and `[@a, 42]` would write `42` where
the closure only ever writes `b`. Reads disclose no more than the body names
(§4); writes would. A named import reads its caller through the same kind of
lookup, and since v0.29.1 its alias of a caller binding is refused too, with
`$!.read-only-scope` (#441).

The scope is live, not a snapshot, as a closure's is (spec 7). A resumed word
sees exactly what its closure would see if it were called now.

## 4. What a walk discloses

**Ruling: a walk discloses its closure's references, read-only.** This
supersedes `a15` §6, which said no atom reaches a bound closure's scope. Now a
word does, and resuming it reads the value the name is bound to, even when the
closure itself never returns it:

```text
.s 42; .f {.k s; 0}; [f (), [((f & {_}) .1)] | ()]     → [0, 42]
```

The disclosure has three bounds:

- **Only names the body mentions.** A scope is reached only through a word the
  walk yielded, and the walk yields only the body's own atoms.
- **Never a write.** The scope is read through a lookup without write authority,
  and declarations land in the resumption's own frame.
- **No more than evaluation reads.** Every value a resumed word reads is one the
  closure's own evaluation could read at that point.

Holding a closure has always meant being able to run it. Under this ruling,
holding its walk also means being able to run any part of it. That is what
"evaluation, stopped" means, and it is the homoiconic promise: code is data and
data is code, with nothing to tell them apart.

## 5. `|` reads its site

A fold is the one operation whose answer depends on where it is written, because
it finishes an evaluation there. The evaluator already holds that scope when it
applies an operator, and the operator answers a fresh curry each time, so
`FrameExpr` hands the scope to that curry (`Frame.atSite`), and the curry hands
it to `ReduceElements`. Nothing is copied, and the curry holds the scope only as
long as it lives. 8,000 folds take 26.7–27.9 ms against master's 26.2–26.3 ms,
and the Figures testdoc runs in the same 0.37 s.

## 6. A whole walk resumed is the call; a part resumed is a call of that part

**Ruling: resuming a whole walk is calling the closure.** Checked across
declarations, nested closures, shadowing, an aggregate written in the body, a
repetition and a free name:

```text
.x 5; .f {.a 1; .b (a + 1); [a, b]}; [f (.x 5), (f & {_}) | (.x 5)]   → [[1, 2], [1, 2]]
.x 5; .f {.a 1; {.a 2; a} ()}; [f (.x 5), (f & {_}) | (.x 5)]         → [2, 2]
.x 5; .f {x * 2}; [f (.x 5), (f & {_}) | (.x 5)]                      → [10, 10]
.x 5; .f {.n 3; n [7]}; [f (.x 5), (f & {_}) | (.x 5)]                → [[7, 7, 7], [7, 7, 7]]
```

**Ruling: resuming part of a walk is calling a closure whose body is that
part.** What a walk freezes is its closure's execution. A closure literal inside
that body is a step of it, and is frozen as a closure of its own only when that
execution reaches it. So resuming the inner `{a}` of `{.a 1; {a}}` alone runs
one step from a fresh frame, without the `.a 1;` before it, exactly as calling
`{{a}}` would:

```text
.f {.a 1; {a}}
  (f ()) ()              → 1
  ((f & {_}) | ()) ()    → 1                    the whole walk, resumed, then called
  ((f & {_}) .3) | ()    → $!.name-missing a    the inner step alone
.f {{a}}; (f ()) ()      → $!.name-missing a    the same step, as a body of its own
```

A part answers as a part, which is what makes a walk both freeze-dried execution
and an aggregate: every step is a frame that can be walked, counted, compared or
resumed on its own.

**The one difference is a write.** A closure that writes through an alias to a
binding outside its own frame writes it when called, and is refused when its
walk is resumed (§3). Everything a closure reads, and everything it declares,
resumes as it runs.
