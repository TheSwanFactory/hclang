# Error Namespaces and the `$!` Catch Operator

**Status:** Implemented in v0.40.0 (PR
[#473](https://github.com/TheSwanFactory/hclang/pull/473)). §1 records the
owner's decisions; §9 lists the smaller choices made on the owner's instruction
to use judgement, which the owner approved. §10 notes where the implementation
settled details this spec left open.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360);
error-name translation is split out to
[#474](https://github.com/TheSwanFactory/hclang/issues/474).\
**Baseline:** v0.39.0 (`05b4f25`). Probes were run there; the binding and
parsing probes in §5 used the spike's variant B
(`experiments/a13-recovery-spike/`), spelled `catch`.\
**Prior:** [10](10-unified-diagnostic-failures.md) (the error literal),
[11](11-recovery-semantics.md) through [13](13-recovery-spike-findings.md)
(recovery semantics and the spike), and
[a16](../a16-concrete-semantics-graph.md) (tight expressions).\
**Scope:** PR [#473](https://github.com/TheSwanFactory/hclang/pull/473), as a
breaking release (v0.40.0). Two commits, each passing `test:all`: namespaces and
legacy removal first, then the catch operator and observations.

## 1. Decisions

1. **Two error namespaces, both with a dot.** Almost every error is made by the
   interpreter, so the shorter spelling is the system's: `$!.reason` is a system
   error and `$!!.reason` is a user error, raised by HC code (bundled modules
   included).
2. **User code can write `$!.reason` but cannot raise it.** Written in a schema,
   it names a system error kind. Raised from user code, it answers the user
   error with the same reason, `$!!.reason`.
3. **The testdoc syntax stays.** `$+…;`, `$-…;`, `$~…;` and `$=…;` keep their
   lexing and rendering.
4. **Bounds errors join `$!`, and `type-mismatch` is dropped.**
   `$>.bounds-exceeded` becomes `$!.bounds-exceeded`, so every error starts with
   `$!`, and `$!.type-error` is the one type kind.
5. **Bare `$!` is the catch operator.** The legacy note forms are removed to
   free it.
6. **Spacing sets what is guarded** (§5.1). `E $! H`, spaced on both sides,
   guards the whole expression to its left. `x $!{H}`, with the handler abutting
   the operator, guards only the term before it. `x$!` stays a lexical error.
7. **Nothing to guard, or no handler, is an error** (§5.3).
8. **`$#` is both the observation's printed form and an anchor** for the current
   handler's observation (§6).
9. **The observation's members are symbolic and read through `$#`:** `$#.!` is
   the original error and `$#.#` is its reason (§7). Error-name translation is
   #474.

## 2. The `$` family after this change

| Spelling                   | Meaning                                           | Change         |
| -------------------------- | ------------------------------------------------- | -------------- |
| `$`, `$.x`                 | The file or module namespace                      | Unchanged      |
| `$$`, `$$.x`               | The host namespace                                | Unchanged      |
| `$!.reason`                | A system error; written by user code, a kind (§4) | Changed        |
| `$!!.reason`               | A user error                                      | New            |
| `$!`                       | The catch operator                                | New            |
| `$#`, `$#.!`, `$#.#`       | The current observation, its error, its reason    | New            |
| `$+ $- $~ $=` …`;`         | Test reports                                      | Unchanged      |
| `$!word;`, `$>…;`, `$<>…;` | Legacy notes                                      | Removed        |
| `$!!` without a dot, `x$!` | —                                                 | Lexical errors |

Hand-written legacy notes appear only in the lexer's own tests (`$!missing;`,
`$>bounds;`, `$<>type;`), so removing them breaks no program in the corpus. `$#`
lexes today as the file anchor followed by a comment (`$# note` answers `$`). No
HC source in the repository writes it.

## 3. Rendering and classification

System errors keep the spelling they print today, apart from bounds errors:

```
1 / 0          => $!.division-by-zero /                        unchanged
[].nope        => $!.name-missing “$:FrameArray.84.nope”;      unchanged
[1] .5         => $!.bounds-exceeded “[0..1].5”;               was $>.bounds-exceeded …
Demi [2, 0]    => $!!.invalid-demi                             was $!.invalid-demi
$!!.zero       => $!!.zero                                     was written $!.zero
```

**Classification rule:** an error is a user error exactly when it came from
evaluating a `$!!.reason` literal, or from user code raising `$!.reason`
(decision 2). Everything constructed in TypeScript under `lib/` is a system
error, including errors the interpreter makes while running bundled HC, such as
`$!.demi-prologue-missing`.

So the interpreter's roughly 270 `$!.` construction sites in `lib/`, and the
expectations that print them, stay as they are. What changes:

- the user literal, from `$!.reason` to `$!!.reason`, in spec 10's tests and the
  docs;
- the four bundled refusals that #472 migrated: `$!!.invalid-demi`,
  `$!!.invalid-scale`, `$!!.unsupported-figure` and `$!!.invalid-router`, and
  the expectations that print them;
- the bounds note's rendering, from `$>.` to `$!.`;
- the `type-mismatch` note, which nothing in `lib/` constructs outside tests.

Reading a printed system error back as source gives the user error with the same
reason (decision 2), with its subject dropped, as today.

## 4. Writing `$!.reason` without raising it

Decision 2 gives `$!.reason` two meanings by position:

- **As a kind,** inside a schema: `<$!.division-by-zero>` matches system errors
  with that reason, and `<$!!.invalid-demi>` matches user errors with theirs.
- **As a raised value,** in expression position: `$!.division-by-zero` written
  in user code answers `$!!.division-by-zero`.

At v0.39.0 a literal is one frame built when the source is scanned (12c §3), and
a schema keeps its candidates as written: `<$!.division-by-zero>` builds, and
`5 ~ <$!.division-by-zero>` answers nil without propagating. So `$!.reason` is
scanned as a **kind literal**: a frame that a schema holds as a candidate, and
that answers the user error when it is evaluated as a term.

**Re-raising is not forging.** A handler that answers `$#.!` returns the
original error frame itself (spec 13 §3.1). Nothing new is raised, so decline
and re-raise keep a system error intact. Only a newly written `$!.reason` is
converted.

## 5. The `$!` operator

On success the guarded value is the answer and the handler is not evaluated. On
failure the handler is called with the observation (§6). Its answer replaces the
error; answering `$#.!` declines; a new error from the handler wins. This is 11
§3 with the outcomes of 12 through 13. It is built as a boundary in expression
reduction, as spike variant B was (13 §2).

### 5.1 Two extents

**Spaced: `E $! H`.** The operator guards everything to its left in its
expression, as the spike's boundary did:

```
1 + (1 / 0) $! {0}           => 0             guards 1 + (1 / 0)
.x (1 / 0) $! {0}; x         => 0, then x is missing    guards the declaration
```

**Tight handler: `x $!{H}`.** The handler abuts the operator, so `$!{H}` is one
tight expression (a16). The spike shows how that parses:

```
.x (1 / 0) catch{0}          terms: .x | (1 / 0) | (catch { 0 })
x catch{0} catch{1}          terms: x | (catch { 0 }) | (catch { 1 })
```

A tight expression that begins with `$!` is a **catcher term**. It handles the
failure immediately before it:

- **The preceding term failed.** Today the reducer returns a failing term at
  once (13 §2). The boundary instead looks one term ahead: if the next term is a
  catcher, it handles the failure, and its answer continues as that term's
  value.
- **The expression so far failed** at a combination step, as `1 / 0` does when
  `/` meets `0`. The catcher handles the accumulator.

So:

```
.x (1 / 0) $!{0}; x          => x is 0
1 + (1 / 0) $!{0}            => 1
x $!{h1} $!{h2}              => h1, then h2 if h1 leaves an error
[(1 / 0) $!{0}, 2]           => [0, 2]
```

The spaced form in a declaration stays a trap: the whole declaration fails, the
handler's answer replaces it, and `x` is never bound. Documentation shows the
tight form for declarations.

`x$!{0}` stays a lexical error under the dollar family's reservation rule
(`doc/GRAMMAR.md`, "Scope anchors"), as `x$` is today. The space before `$!` is
the spelling.

### 5.2 Lexing

`$!` followed by a boundary, such as a space, `{`, `(`, `[` or a quote, is the
operator. `$!.` and `$!!.` are the literals. `$!` followed by a word character
(`$!x`, the removed `$!word;` form) and `$!!` without a dot are lexical errors,
so a handler held in a name needs the spaced form, `x $! h`. With the legacy
notes gone, `(1 / 0) $!{0}` lexes; at v0.39.0 `$!{0}` scans as a legacy note
that never closes.

### 5.3 Nothing to guard

A leading `$!`, a trailing `$!`, and `$!` followed directly by another `$!` are
found in the reducer, where the guarded or handler part is empty. They are
system errors:

| Source        | Answer                     |
| ------------- | -------------------------- |
| `$! {0}`      | `$!.catch-operand-missing` |
| `x $!`        | `$!.catch-handler-missing` |
| `x $! $! {0}` | `$!.catch-handler-missing` |

The reason names follow the existing `-missing` family (`name-missing`,
`property-missing`, `schema-missing`). They are English for now, like every
other reason (#474).

## 6. `$#`: the observation

**As an anchor.** Inside a handler, `$#` is the observation of the error that
handler was called with, at any depth: in a conditional branch, an iterator
callback, or a closure the handler builds. This removes the underscore ladder
that spec 13 §3.4 found to be the main cost of typed handlers. Inside nested
handlers, `$#` is the innermost handler's observation, as a scope anchor names
its nearest scope. Outside every handler, `$#` answers `$!.observation-missing`.

The handler's argument `_` is the same observation, so handlers that do not
reach into branches can still use `_`.

**As a printed form.** An observation prints as `$#.reason`, for example
`$#.division-by-zero`. It is not an error, so it never propagates.

## 7. The observation's members

| Read   | Answers                                                                      |
| ------ | ---------------------------------------------------------------------------- |
| `$#`   | The observation itself, for matching: `$# ~ <$!.division-by-zero>`           |
| `$#.!` | The original error frame. Reading it propagates, which declines or re-raises |
| `$#.#` | The reason, as text (English until #474)                                     |

They are read through the anchor, as `$.x` and `$$.x` are, so the anchor defines
what `.!` and `.#` mean after `$#`. Elsewhere `.!` stays boolean negation and
`.#` stays Count. Any other member of `$#` answers `$!.name-missing`, as `$.x`
does for a missing member. Spec 13's `.text` is dropped.

**Matching.** An observation matches a schema candidate that is a `$!.R` kind
literal when it observes a system error with reason R, and a `$!!.R` literal
when it observes a user error with reason R. This replaces the spike's spelling
coincidence (13 §3.3).

With `$#`, both typed-handler shapes from 12c §1 lose their underscores:

```
x $!{(($# ~ <$!.division-by-zero>) .!) ? {$#.!} : {()}}          nil on a match
x $!{(($# ~ <$!.division-by-zero>) ? {[0]} : {[$#.!]}) .0}       0 on a match
```

## 8. Migration

| Area                            | Change                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Lexer (`frame-scope-anchor.ts`) | `$!` operator, `$!!.reason` literal, `$!.reason` kind literal, `$#` anchor, legacy notes removed |
| `lib/` error construction       | Unchanged for system errors; bounds note renders `$!.`; `type-mismatch` removed                  |
| Bundled refusals                | `$!!.` in `hc/demi.hc`, `hc/figures.hc`, `hc/rotor-router.hc` and their expectations             |
| User-literal tests and docs     | `$!.reason` to `$!!.reason` (spec 10's tests, `doc/GRAMMAR.md`, `doc/LANGUAGE.md`)               |
| Reducer (`frame-expr.ts`)       | The `$!` boundary: spaced split and catcher terms                                                |
| Observation                     | A frame type for observations, the `$#` anchor and its members, kind matching                    |
| Tests                           | Port `spike.test.ts` into `lib/` with the final spellings; add §5 and §7's cases                 |
| VS Code grammar                 | `$!`, `$!!.`, `$#` rules; legacy note rules removed; extension bump                              |
| Release                         | Breaking: v0.40.0, CHANGELOG                                                                     |

## 9. Choices made in this spec

The owner asked for judgement on these, so they are listed here to review before
implementation:

1. **What a catcher term handles** (§5.1): the preceding term's failure, or else
   the expression so far.
2. **The reasons for missing operands and handlers** (§5.3):
   `catch-operand-missing` and `catch-handler-missing`.
3. **`$#` outside a handler** (§6): `$!.observation-missing`.
4. **Nested handlers** (§6): `$#` is the innermost handler's observation.
5. **The printed form** (§6): `$#.reason`. It reads like a member read on the
   anchor, so it does not round-trip as source, as error renderings with
   subjects already do not (spec 10 §6.2).
6. **`.text` is dropped** (§7).

## 10. Implementation notes

- **A handler that is not a closure** is the replacement itself: `(1 / 0) $! 5`
  is `5`. A closure is called with the observation.
- **`$#` is dynamic.** It names the observation of the innermost handler that is
  running, so a closure a handler builds sees it only while the handler runs.
- **The observation's members** are its own: `_ .!` and `_ .#` read them too,
  since `_` is the same observation.
- **The kind written in a `$!.reason` literal** is recorded beside the user
  error it raises (`lib/frames/error-kind.ts`), and a schema keeps that frame as
  its candidate, which is how `<$!.reason>` names the system kind.
- **Expression reduction calls handlers late-bound** through `Frame.catchWith`,
  which `frame-observation.ts` installs, so `frame-expr.ts` imports nothing new
  (`lib/load-order.test.ts`).
