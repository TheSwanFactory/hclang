# Error Namespaces and the `$!` Catch Operator

**Status:** Proposal for discussion. The decisions in §1 are the owner's; §8
lists what must be settled before implementation. Nothing is implemented.\
**Issue:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).\
**Baseline:** v0.39.0 (`05b4f25`). Probes were run there, and the declaration
and position probes in §5 used the spike's variant B
(`experiments/a13-recovery-spike/`).\
**Prior:** [10](10-unified-diagnostic-failures.md) (the `$!.reason` literal),
[11](11-recovery-semantics.md) through [13](13-recovery-spike-findings.md)
(recovery semantics and the spike).\
**Scope:** the specification, the rename, and the recover operator all land in
PR [#473](https://github.com/TheSwanFactory/hclang/pull/473), as a breaking
release (v0.40.0).

## 1. Decisions

1. **Two error namespaces, both with a dot.** `$!.reason` is an error raised by
   HC code, including bundled modules such as `hc/demi.hc`. `$!!.reason` is an
   error made by the interpreter. Both use spec 10 §6.1's reason grammar.
2. **User code can write `$!!.reason` but cannot raise it.** Writing it names an
   interpreter error kind, for example in a schema. Raising it from user code
   answers the user error with the same reason.
3. **The testdoc syntax stays.** `$+…;`, `$-…;`, `$~…;` and `$=…;` keep their
   current lexing and rendering.
4. **Bounds and type mismatches join `$!!`.** They become `$!!.bounds-exceeded`
   and `$!!.type-mismatch`, so every error starts with `$!`. (The type-mismatch
   note is unused at the baseline; see §8 question 5.)
5. **Bare `$!` is the catch operator.** `E $! H` is spec 11's use-site recover,
   with the semantics of 12 through 13. The other legacy note forms are removed
   to free it.

## 2. The `$` family after this change

| Spelling                   | Meaning                                                 | Change         |
| -------------------------- | ------------------------------------------------------- | -------------- |
| `$`, `$.x`                 | The file or module namespace                            | Unchanged      |
| `$$`, `$$.x`               | The host namespace                                      | Unchanged      |
| `$!.reason`                | A user error                                            | Unchanged      |
| `$!!.reason`               | An interpreter error kind; raising it gives `$!.reason` | New            |
| `$!`                       | The catch operator                                      | New            |
| `$+ $- $~ $=` …`;`         | Test reports                                            | Unchanged      |
| `$!word;`                  | Legacy missing-name note                                | Removed        |
| `$>…;`                     | Legacy bounds note                                      | Removed        |
| `$<>…;`                    | Legacy type-mismatch note                               | Removed        |
| `$!!` without a dot, `$!x` | —                                                       | Lexical errors |

Hand-written legacy notes appear only in the lexer's own tests (`$!missing;`,
`$>bounds;`, `$<>type;`), so removing them breaks no program in the corpus.

## 3. Rendering and classification

Every error the interpreter makes renders as `$!!.reason`, followed by whatever
subject it carries today:

```
1 / 0        => $!!.division-by-zero /                       was $!.division-by-zero /
[].nope      => $!!.name-missing “$:FrameArray.84.nope”;     was $!.name-missing …
[1] .5       => $!!.bounds-exceeded “[0..1].5”;              was $>.bounds-exceeded …
$!.zero      => $!.zero                                      unchanged
```

**Classification rule:** an error is a user error exactly when it came from
evaluating a `$!.reason` literal. Everything constructed in TypeScript under
`lib/` is an interpreter error, including errors the interpreter makes while
running bundled HC (`$!!.demi-prologue-missing`). Bundled modules' own refusals
stay user errors: `$!.invalid-demi`, `$!.invalid-scale`, `$!.unsupported-figure`
and `$!.invalid-router`.

The legacy note labels map as follows:

| Note label | Today renders             | After                      |
| ---------- | ------------------------- | -------------------------- |
| `!`        | `$!.name-missing “…”;`    | `$!!.name-missing “…”;`    |
| `>`        | `$>.bounds-exceeded “…”;` | `$!!.bounds-exceeded “…”;` |
| `<>`       | `$<>.type-mismatch …;`    | `$!!.type-mismatch …;`     |
| `+ - ~ =`  | test reports              | unchanged                  |

Reading a printed interpreter error back as source gives the user error with the
same reason (decision 2), with its subject dropped as today.

## 4. Writing `$!!` without raising it

Decision 2 needs `$!!.reason` to mean different things in two positions:

- **As a kind,** inside a schema: `<$!!.division-by-zero>` matches interpreter
  errors with that reason.
- **As a raised value,** in expression position: `$!!.division-by-zero` answers
  `$!.division-by-zero`.

At v0.39.0 a `$!.reason` literal is one error frame built when the source is
scanned (12c §3), and a schema keeps its candidates as written:
`<$!.division-by-zero>` builds, and `5 ~ <$!.division-by-zero>` answers nil
without propagating. So a `$!!.reason` literal can be scanned as a **kind
literal**: a frame that a schema holds as a candidate, and that answers the user
error when it is evaluated as a term.

**Re-raising is not forging.** A handler that answers its observation's `.error`
returns the original interpreter error frame (spec 13 §3.1). Nothing new is
raised, so decline and re-raise keep the `$!!` error intact. Only a newly
written `$!!.reason` is converted.

## 5. The `$!` operator

`E $! H` follows 11 §3 and 12 through 13: on success it answers `E` without
evaluating `H`; on failure it calls `H` with an observation; the answer replaces
the error, the observation's `.error` declines, and a new error from `H` wins.
`E $! H₁ $! H₂` chains left to right.

It is built as spike variant B: a boundary in expression reduction that splits
an expression at each `$!` (spec 13 §2). Three questions follow from the spike's
probes.

### 5.1 Declarations

The spike's boundary binds more loosely than everything else in its expression,
declarations included:

```
.x (1 / 0) catch {0}; x        => 0, then $!.name-missing … x     x is never bound
.x ((1 / 0) catch {0}); x      => 0                               x is 0
```

In the first line the whole declaration is guarded, so the handler's answer
replaces the declaration's failure and nothing binds `x`. Most readers expect
`.x E $! H` to bind `x` to the recovered value. Options:

1. **Keep it loosest.** Simple and uniform, but this case needs parentheses and
   gets a silent wrong answer without them.
2. **Guard the declared value.** When an expression is a declaration, `$!`
   guards the value and the declaration binds the result: `.x E $! H` means
   `.x (E $! H)`. This matches how the line reads, at the cost of one rule for
   declarations.

This spec recommends option 2.

### 5.2 Position

```
1 + (1 / 0) catch {0}          => 0      guards 1 + (1 / 0)
1 + ((1 / 0) catch {0})        => 1      guards only 1 / 0
[1 / 0 catch {0}, 2]           => [0, 2] per element
{1 / 0 catch {0}} ()           => 0
catch {0}                      => ()     nothing to guard
```

Elements of a comma expression and closure bodies each get their own boundary,
which is what a reader expects. A leading `$!` has nothing to guard and in the
spike silently answers nil. It should be an error instead. The question is
whether that is a lexical error or an interpreter error such as
`$!!.catch-without-operand`.

### 5.3 Missing handler

`E $!` with nothing after it, and `E $! $! H`, need the same treatment as a
leading `$!`.

## 6. The observation

Spec 13 §3 used three properties: `.error`, `.reason` and `.text`. With two
namespaces, a handler can tell them apart through matching (`obs ~ <$!.x>`
against `obs ~ <$!!.x>`), so no property is added for the namespace.

**Matching rule.** An observation of an error with namespace N and reason R
matches a schema candidate that is a `$!.R` literal (N user) or a `$!!.R` kind
literal (N interpreter). It replaces the spike's spelling coincidence (13 §3.3).

**Printing.** The spike printed an observation as `$!.<reason>`, which now reads
as a user error. An observation must print as something that is not an error.
Options:

1. As its properties:
   `[.error $!!.division-by-zero /; .reason “division-by-zero”; .text “…”]`.
2. As a wrapper: `observed($!!.division-by-zero /)`.

This is a naming decision for §8.

## 7. Migration

| Area                            | Change                                                                              | Size at v0.39.0          |
| ------------------------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| Lexer (`frame-scope-anchor.ts`) | `$!` operator, `$!!.reason` kind literal, legacy note forms removed                 | one syntax family        |
| `lib/` error construction       | `$!.` to `$!!.` for interpreter errors; note labels `!`, `>`, `<>` render as `$!!.` | 273 occurrences of `$!.` |
| `lib/` tests                    | Expectations                                                                        | 375                      |
| `hc/*.hc`                       | `# …` expectations for interpreter errors; bundled refusals unchanged               | 158                      |
| `cli/`, `scripts/`, `web/`      | Expectations                                                                        | 13                       |
| `doc/`                          | Grammar and language reference                                                      | 38                       |
| Recovery                        | Move the spike's boundary and observation into `lib/`; port `spike.test.ts`         | spec 13                  |
| VS Code grammar                 | New `$!`, `$!!.` rules; legacy note rules removed                                   | extension bump           |
| Release                         | Breaking: v0.40.0, CHANGELOG                                                        |                          |

Each `$!.` occurrence must be classified as user or interpreter rather than
replaced globally, because the bundled refusals and the literal tests keep
`$!.`.

## 8. To discuss before implementation

1. **Declarations** (§5.1): loosest binding, or guard the declared value? This
   spec recommends guarding the value.
2. **A missing operand or handler** (§5.2, §5.3): lexical error or an
   interpreter error, and which reason?
3. **How an observation prints** (§6).
4. **The observation's property names:** keep `.error`, `.reason` and `.text`,
   or drop `.text`?
5. **`type-error` and `type-mismatch`.** Schemas, typed setters and first-class
   types make `$!.type-error` (`schema-matcher.ts`, `frame-symbol.ts`,
   `frame-type.ts`). The `<>` note label renders `$<>.type-mismatch`, but
   nothing in `lib/` outside tests constructs it; only `FrameNote.index`, the
   bounds note, is used (`frame-list.ts`). Should `type-mismatch` be dropped,
   leaving `$!!.type-error` as the one kind?
6. **Ordering in the PR:** rename first and then add `$!`, as separate commits
   that each pass `test:all`?
