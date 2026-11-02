# Error Namespaces and the `$!` Catch Operator

**Status:** Proposal for discussion. The decisions in §1 are the owner's; §9
lists what must be settled before implementation. Nothing is implemented.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0 (`05b4f25`). Probes were run there; the binding probes in
§5 used the spike's variant B (`experiments/a13-recovery-spike/`), spelled
`catch`.\
**Prior:** [10](10-unified-diagnostic-failures.md) (the `$!.reason` literal),
[11](11-recovery-semantics.md) through [13](13-recovery-spike-findings.md)
(recovery semantics and the spike), and
[a16](../a16-concrete-semantics-graph.md) (tight expressions).\
**Scope:** the specification, the namespace change, and the catch operator all
land in PR [#473](https://github.com/TheSwanFactory/hclang/pull/473), as a
breaking release (v0.40.0), in that order of commits, each passing `test:all`.

## 1. Decisions

1. **Two error namespaces, both with a dot.** Almost every error is made by the
   interpreter, so the shorter spelling is the system's: `$!.reason` is an
   interpreter error and `$!!.reason` is a user-defined error, raised by HC code
   (bundled modules included).
2. **User code can write `$!.reason` but cannot raise it.** Writing it names a
   system error kind, for example in a schema. Raising it from user code answers
   the user error with the same reason, `$!!.reason`.
3. **The testdoc syntax stays.** `$+…;`, `$-…;`, `$~…;` and `$=…;` keep their
   lexing and rendering.
4. **Bounds errors join `$!`.** `$>.bounds-exceeded` becomes
   `$!.bounds-exceeded`, so every error starts with `$!`. The `type-mismatch`
   note is dropped; `$!.type-error` is the one type kind.
5. **Bare `$!` is the catch operator.** `E $! H` is spec 11's use-site recover,
   with the semantics of 12 through 13. The legacy note forms are removed to
   free it.
6. **Spacing sets the guarded extent** (§5): with spaces `$!` guards its whole
   expression, and abutting `$!` guards only its neighbours.
7. **Nothing to guard, or no handler, is an error** (§5.3).
8. **Observations get a `$#` spelling** (§6).
9. **No English in the protocol** (§7): the observation's members are symbols,
   and error names have translation tables.

## 2. The `$` family after this change

| Spelling                   | Meaning                                           | Change        |
| -------------------------- | ------------------------------------------------- | ------------- |
| `$`, `$.x`                 | The file or module namespace                      | Unchanged     |
| `$$`, `$$.x`               | The host namespace                                | Unchanged     |
| `$!.reason`                | A system error; written by user code, a kind (§4) | Changed       |
| `$!!.reason`               | A user error                                      | New           |
| `$!`                       | The catch operator                                | New           |
| `$#`                       | Observations (§6)                                 | New           |
| `$+ $- $~ $=` …`;`         | Test reports                                      | Unchanged     |
| `$!word;`, `$>…;`, `$<>…;` | Legacy notes                                      | Removed       |
| `$!!` without a dot        | —                                                 | Lexical error |

Hand-written legacy notes appear only in the lexer's own tests (`$!missing;`,
`$>bounds;`, `$<>type;`), so removing them breaks no program in the corpus.

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

This order makes the migration much smaller than spec 14's first draft proposed.
The interpreter's roughly 270 `$!.` construction sites in `lib/`, and the
expectations that print them, stay as they are. What changes is:

- the user literal, `$!.reason` to `$!!.reason`, in spec 10's tests and docs;
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
  with that reason.
- **As a raised value,** in expression position: `$!.division-by-zero` written
  in user code answers `$!!.division-by-zero`.

At v0.39.0 a literal is one frame built when the source is scanned (12c §3), and
a schema keeps its candidates as written: `<$!.division-by-zero>` builds, and
`5 ~ <$!.division-by-zero>` answers nil without propagating. So `$!.reason` can
be scanned as a **kind literal**: a frame that a schema holds as a candidate,
and that answers the user error when it is evaluated as a term. `<$!!.reason>`
then matches user errors.

**Re-raising is not forging.** A handler that answers its observation's original
error returns that frame itself (spec 13 §3.1). Nothing new is raised, so
decline and re-raise keep a system error intact. Only a newly written
`$!.reason` is converted.

## 5. The `$!` operator

`E $! H` follows 11 §3 and 12 through 13: on success it answers `E` without
evaluating `H`; on failure it calls `H` with an observation; the answer replaces
the error, answering the original declines, and a new error from `H` wins.
Handlers chain left to right. It is built as spike variant B, a boundary in
expression reduction (spec 13 §2).

### 5.1 Spacing sets the extent

HC already binds abutting terms tighter than spaced ones: since a16, several
abutting terms are one tight expression, evaluated before the terms around it.
The boundary splits whatever expression contains the operator, so spacing gives
two extents with no new rule. Measured with the spike's `catch`:

```
.x (1 / 0) catch {0}; x            => 0, then $!.name-missing … x   guards the declaration
.x (1 / 0)catch{0}; x              => 0                             x is bound to 0
1 + (1 / 0)catch{0}                => 1
1 + (1 / 0) catch {0}              => 0                             guards 1 + (1 / 0)
[(1 / 0)catch{0}, 2]               => [0, 2]
.f {_ + 1}; f (1 / 0)catch{0}      => 1
(1 / 0)catch{0}catch{1}            => 0                             chains when tight
```

So `.x E$!H` binds `x` to the recovered value, and `.x E $! H` guards the whole
declaration. The spaced form in a declaration stays a trap: the declaration
fails, the handler's answer replaces it, and `x` is never bound. Documentation
should show the tight form for declarations.

### 5.2 Lexing a tight `$!`

The spike's word lexes anywhere; `$!` does not. At v0.39.0:

```
(1 / 0)$!{0}       => scanned as the legacy note `$!{0}`, which never closes
x$                 => lexical error: invalid dollar form
(1)$  {1}$         => fine: `$` may follow `)` or `}`
```

Removing the legacy notes fixes the first. The second is the dollar family's
reservation rule (`doc/GRAMMAR.md`, "Scope anchors"): `$` is a lexical error
right after an identifier character, so `x$!{0}`, `o.x$!{0}` and `5$!{0}` would
not lex. Either `$!` is exempted from that rule, which `x$` and `x$$` still
keep, or the tight form needs a closing bracket before it, `(x)$!{0}`. On the
right, `$!` followed by `{`, `(`, `[` or a name starts the handler; `$!.` and
`$!!.` stay the literals, and `$!#` is §6's business.

### 5.3 Nothing to guard

A leading `$!`, a trailing `$!`, and two `$!` with nothing between them are
errors. They can be found in the reducer, where a guarded or handler segment is
empty, so they are system errors rather than lexical ones. In the spike a
leading `catch {0}` silently answers nil.

## 6. Observations: `$#`

The spike's observation printed as `$!.<reason>`, which now reads as a system
error. Decision 8 gives observations their own family, `$#`, after the `#` of
the native observers (`.#`, `.##`, `.###`). The decision does not yet say which
of these `$#` is:

1. **How an observation prints:** `$#.division-by-zero`, the way an error prints
   as `$!.division-by-zero`.
2. **An anchor for the current handler's observation,** as `$` is for the file:
   `$#` inside any handler, at any depth, is its observation. That would remove
   the underscore ladder that spec 13 §3.4 found to be the main cost of typed
   handlers (`__ .error` inside a branch would become `$#…`).
3. **Both:** it prints as `$#.reason`, and `$#` reads the current one.

Option 3 is the most useful. It needs a rule for nested handlers: whether `$#`
is the innermost handler's observation, as `_` is the innermost argument.

## 7. No English in the protocol

### 7.1 The observation's members

The proposal is symbolic names: `!` for the original error and `#` for the
reason. They collide with existing operators if written as ordinary members:

```
<>.!               => ()        `.!` is boolean negation
[1].#              => 1         `.#` is Count, answered before any name lookup
```

`(obs ~ K) .!` is the nil-safe handler shape of 12c §1, so an observation's own
`.!` cannot silently change what negation means. Size operators are dispatched
before lookup (`Frame.SIZE_OPERATORS`), so an observation would answer Count for
`.#` unless it overrides it. The written form `$!.!` and `$!.#` from the
discussion does not lex either: `$!.` must be followed by a reason identifier.
Options:

1. **Through the anchor:** if §6 option 2 or 3 holds, `$#.!` and `$#.#` read
   from the observation, and the anchor's member read is free to define them, as
   `$.x` and `$$.x` define theirs.
2. **Override on observations:** an observation answers `.!` with its error and
   `.#` with its reason, and negation and Count of an observation are given up.
3. **Other symbols** that collide with nothing.

### 7.2 Error names

Error reasons are English identifiers today (`division-by-zero`,
`name-missing`), and so are spec 10's literals and the kind descriptors. One
precedent exists: `FrameNote.LABELS.en` maps note labels to English names.

The proposal is translation tables for error names. To settle:

- **What the canonical key is:** the current English identifier, which tables
  translate for display, or a language-neutral code that every name, English
  included, comes from a table.
- **Where tables apply:** rendering only, or also the literals a program writes
  and the kinds it matches, so that `<$!.division-par-zéro>` and
  `<$!.division-by-zero>` are the same kind.
- **User errors:** `$!!.reason` names are the program's own, so they are
  probably not translated.

This is larger than the rest of this spec and could be its own document.

## 8. Migration

| Area                            | Change                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| Lexer (`frame-scope-anchor.ts`) | `$!` operator, `$!!.reason` literal, `$!.reason` kind literal, `$#`, legacy notes removed |
| `lib/` error construction       | Unchanged for system errors; bounds note renders `$!.`; `type-mismatch` removed           |
| Bundled refusals                | `$!!.` in `hc/demi.hc`, `hc/figures.hc`, `hc/rotor-router.hc` and their expectations      |
| User-literal tests and docs     | `$!.reason` to `$!!.reason` (spec 10's tests, GRAMMAR.md, LANGUAGE.md)                    |
| Recovery                        | Move the spike's boundary and observation into `lib/`; port `spike.test.ts`               |
| VS Code grammar                 | `$!`, `$!!.`, `$#` rules; legacy note rules removed; extension bump                       |
| Release                         | Breaking: v0.40.0, CHANGELOG                                                              |

Commits in order, each passing `test:all`: namespaces and legacy removal, then
the catch operator and observations.

## 9. To discuss before implementation

1. **Lexing `x$!`** (§5.2): exempt `$!` from the dollar reservation rule after
   identifier characters, or require `(x)$!{…}`?
2. **Which `$#` is** (§6): the printed form, an anchor for the current
   observation, or both? If an anchor, is it the innermost handler's?
3. **The observation's members** (§7.1): through `$#`, overriding `.!` and `.#`
   on observations, or other symbols?
4. **Error-name translation** (§7.2): canonical key, where tables apply, and
   whether it belongs in this PR or its own spec.
5. **The reasons for §5.3's errors.** Under §7.2 they may not be English words.
