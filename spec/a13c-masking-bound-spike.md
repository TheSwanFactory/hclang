# Masking Bound Spike: Attacking a13 §9

**Status:** Spike brief. Adversarial, narrow, and throwaway — one claim, tested
to destruction.\
**Design record:** [`a13`](a13-error-handling.md) §9 and §6a.\
**Prior spike:** [`a13a`](a13a-recovery-spike.md) (brief),
[`a13b`](a13b-recovery-spike-findings.md) (findings). Its code is on
`a13a-recovery-spike` and is the starting point for this one.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360).

## 1. The claim under attack

a13 §9 rules that a running handler is masked **by handler, not by key**, so
that recovery declared inside a handler body — or inside a helper the handler
calls — keeps working. Its entire safety case is one sentence:

> depth is bounded by the number of distinct handler templates, since each is
> masked while it runs

[`a13b`](a13b-recovery-spike-findings.md) Q3 is candid that this was measured
once rather than proved, and a13 now lists it as the only open item that can
make the design **unsafe** rather than merely awkward. Every other question
about recovery is about ergonomics or accuracy. This one is about whether the
interpreter halts.

**Your job is to break it.** A spike that finds a divergent case is the good
outcome. A spike that reports the bound held will be judged on how hard it
tried, and "I ran the obvious cases" is not hard.

## 2. Start with the question the prior spike left hanging

[`a13b`](a13b-recovery-spike-findings.md) Q2 says the guard is "a set of running
handler templates **plus a depth counter**." a13 §9's bound does not mention a
counter, and if the counter is what actually stops the recursion, then the
ruling's stated safety case is not the one the code relies on.

Answer first: **remove the depth counter, keep only the template set, and find
out what happens.** If everything still terminates, the counter was belt and
braces and §9's bound stands so far. If something diverges, you have already
broken the claim and the rest of this brief is about characterizing how.

## 3. What to build

Start from `a13a-recovery-spike` and change as little as possible.

- Default the guard to **value/template masking** — §9's ruling — rather than
  the key masking that spike defaulted to.
- **Implement §6a's once-per-handler rule**, which did not exist when the first
  spike ran. §9 and §6a deliberately share one notion of handler identity, so
  the interaction between them is part of what is under test and cannot be
  assessed with only one of them built.
- Keep the site wiring the prior spike arrived at (the combination step, plus
  the per-term check).
- Keep a counter of handler invocations per failure. Several questions below are
  about that number rather than about termination.

## 4. Attacks

Each names what a success would prove. Report what you tried even when it did
not work, and say why it did not.

**A1. Mint templates at runtime.** The bound assumes the set of handler
templates is finite and fixed. Find out whether a program can create a fresh one
per invocation — a handler that declares a handler, a factory that answers a
closure, a literal evaluated repeatedly.
[`a13b`](a13b-recovery-spike-findings.md) Q3 says `FrameList.copy` reuses term
objects so a template is stable across copies; test whether that holds when the
literal is _re-evaluated_ rather than copied, and whether `instanceCopy` behaves
the same as a plumbing copy here. If a new template can be minted per level, the
bound is false outright.

**A2. Mutual recursion between two handlers.** H1's body provokes H2, H2's body
provokes H1. Both are masked while running, so this should terminate — but
establish exactly when a mask is _released_. If it releases on return rather
than on the whole call's completion, a handler that declines may become
re-enterable while its own failure is still rising.

**A3. Recursion through a helper.** §9's argument for this ruling is that
recovery inside a called helper must keep working. Make the helper the vector: a
handler calls a helper, the helper declares its own handler, the helper's
handler calls the helper again.

**A4. Mask released too early by §6a.** The once-per-handler rule and masking
share one identity notion. Try to make the §6a bookkeeping and the mask disagree
— a handler that has been "used up" for a failure but is not masked, or masked
but not recorded — and see whether either a loop or a lost recovery falls out.

**A5. Recursion through the aggregate path.** a13 §5 now accepts that a frame
may recover its own terms (`[.$: {0}, 1 / 0]`). An aggregate is constructed
fresh on every evaluation. Build a literal whose handler provokes the
construction of the same literal.

**A6. Depth without divergence.** Even a terminating bound is a problem if it is
large. Construct the worst legal case you can with a fixed number of handlers —
nested scopes, each declining — and report the handler-invocation count for one
failure. §6a is supposed to make this linear in the number of handlers; check
whether it does.

## 5. Report regardless of outcome

- **Where the real bound comes from.** After A1–A5: is it the template set, the
  depth counter, some property of `FrameLazy` identity, or a combination? Name
  it precisely enough that a13 §9 can be rewritten to claim the true thing.
- **The worst-case invocation count** for a single failure under §6a plus value
  masking, with the program shape that produces it.
- **What to do if the bound is false.** If value masking cannot be made safe,
  say which fallback you would take and why: key masking (safe, but makes nested
  recovery dead code — the cost §9 rejected it for), a hard depth cap (honest
  but arbitrary), or value masking plus a cap. A recommendation with its
  trade-off stated, not a menu.

## 6. Check one thing back at me

a13 §7 and §11 now claim the refusal is reachable inside a conditional branch
spelled `__` rather than `_`, and on that basis a13 keeps
`lib/ops/conditionals.ts` out of scope. That correction was made against
[`a13b`](a13b-recovery-spike-findings.md) Q6, which had concluded the opposite
from `_` alone.

Verify it independently rather than assuming it. In particular: does `__` reach
the reason at **every** depth a real handler body might use — inside a branch of
a branch, inside a branch inside an iterator callback, inside a helper the
handler calls? If the spelling is right at one level and wrong at another, a13's
discrimination story is worse than it now claims and §8 needs to say so.

## 7. Deliverables, and where each one goes

Same rule as [`a13a`](a13a-recovery-spike.md) §5, and for the same reason: the
code dies, the findings do not.

**Code, tests, and corpus → branch `a13c-masking-bound`, off
`a13-error-handling`.** Push it; do not merge it, do not open a PR, and do not
rewrite existing commits. Starting it from `a13a-recovery-spike` is expected —
say so in the first commit message.

**Findings → `spec/a13d-masking-bound-findings.md`, committed onto
`a13-error-handling` itself**, as a single commit touching that one file. Head
it with a `**Status:**` line naming the spike commit the findings were taken at.
Then, as second-level headings in this order:

- one per attack, A1 through A6, headed exactly that way
- Where the bound comes from
- If the bound is false
- Checking the outward spelling (§6 of this brief)

Real pasted output throughout — the previous findings set that standard and it
should hold.

**Scratch corpus → `cli/hc/masking-bound.hc`, left unregistered.** Neither
doctest harness globs, so an unregistered file stays inert.

Leave `spec/a13-error-handling.md`, `spec/a13b-recovery-spike-findings.md`, and
this file unedited.

## 8. Out of scope

- The `$:` spelling and the dollar-family lexer change (a13 §10).
- M-3 / [#361](https://github.com/TheSwanFactory/hclang/issues/361) — do not
  touch `lib/ops/math.ts`.
- `lib/ops/conditionals.ts` — §6 asks you to _test_ a claim about how branches
  receive arguments, not to change how they do.
- Making `cli/hc/exception-tutorial.md` executable. Leave `cli/hc.test.ts`
  alone.
- Re-litigating anything a13b already settled. Q1's site, Q4's visibility, and
  Q5's collecting opt-out are answered; do not spend the spike re-measuring
  them.

## 9. How this will be judged

1. Was the counter removed first, and reported on honestly?
2. Do the attacks show evidence of genuine effort to break the claim — including
   attacks that failed and why?
3. Is the true source of the bound named precisely, rather than "it terminated"?
4. Is the fallback a recommendation with a stated trade-off?

The prior spike set a high bar by contradicting its own brief's premises in two
places. Do that again if the material supports it — including against this
brief, and against a13 §9 as currently written.
