# The Combination Step Guard

**Status:** Spike brief. Narrow and throwaway — one site, and the rulings that
site forces. It proposes no mechanism and settles nothing about D1–D13, which
are not reopened here.\
**Design record:** [`../a13-error-handle.md`](../a13-error-handle.md), D3, D5,
D11, D13, and the first Open item.\
**Prior:** [`03`](03-recovery-spike-findings.md) and
[`05`](05-masking-bound-findings.md) are the measured findings,
[`06`](06-applying-a-failure.md) is the receiver-side question, and
[`07`](07-what-blocks-implementation.md) is the review that produced this brief
— its §3a instrumentation is the starting point.\
**Issues:** [#360](https://github.com/TheSwanFactory/hclang/issues/360),
[#361](https://github.com/TheSwanFactory/hclang/issues/361).

## 1. Why this exists

Everything else is decided. The record's spelling blocker turned out not to be
one, the masking bound is proved as a parse-time property, and the mechanism ran
end to end in two spikes. What is left is one method and the rulings it forces.

Three separate lines now converge on the curry's own `call`:

- **D3** puts recovery there, because that is where failures are made.
- **D5** needs a guard there to survive M-3. Without one, an operator handed a
  failing operand answers its own domain error and the original failure is gone
  ([`07`](07-what-blocks-implementation.md) §3b).
- **[`06`](06-applying-a-failure.md)**'s receiver-side framing would hook the
  same method, which is why D1's rejection of it was withdrawn.

So the site is not in question. What the guard **tests**, and what it does to
three things passing through that method, is undecided — and unlike the naming
question, no line of code can be written until it is.

**This is not a spike about whether recovery works.** It is a spike about one
conditional in one method, and the honest outcome may be "the obvious guard is
right." Say so with the measurements if that is what you find.

## 2. Start with the thing that is already instrumented

[`07`](07-what-blocks-implementation.md) §3a added two lines at the top of the
curry's `call` answering a failing source or argument unchanged, simulated M-3
in the numeric gate, and removed the reduce's per-term check. That configuration
left one test failing — the one #361's acceptance list already schedules for
replacement — and nothing else moved.

Reproduce that first, from the pasted commands in §3a, before changing anything.
If it does not reproduce, stop and report that: every question below is
downstream of it.

## 3. The questions

**Q1. What does the guard test?** The error flag alone, or the predicate that
also reports an aggregate holding one immediately. These are two questions
sharing one predicate — "did this fail?" and "may this accumulate?" — and
[`06`](06-applying-a-failure.md) §3c measured that they disagree about a
half-failed aggregate. The shallow rule is load-bearing for a11, which needs
`'./nope.txt' | []` to report itself as a failed result. Answer which question
the **guard** is asking, and whether answering it needs the predicate split.

**Q2. Does the guard change effect ordering?** The record's remaining objection
to the receiver-side framing is that terms after a failure would evaluate where
a receiver answers. [`06`](06-applying-a-failure.md) §3a claims the accumulator
check, not the per-term check, is what protects this. Test it with effects
rather than with values: a resource write in a term after a failing one, and
count the writes. Nil is the only precedent for the ruling, so if ordering does
change, propose the ruling explicitly rather than letting the measurement stand
as one.

**Q3. Can one guard serve both the handler lookup and the receiver protocol?**
D3's recovery and [`06`](06-applying-a-failure.md)'s dispatch want the same
method. If they compose — dispatch first, then offer the handler what the
receiver declined, or the reverse — then the two framings are sequential rather
than exclusive, and the record's third Open item is a question about how far to
go rather than which to pick. If they conflict, name the conflict precisely.
This is the question with the most leverage and the least evidence.

**Q4. What do `?` and `:` answer to a failing source?** D11 says they are
untouched and never see an error, and that holds today because the reduce ends
first. With a guard at the curry, verify it still holds: a recovered term
ordinary by the time an operator sees it, an unrecovered one still ending the
reduce, under M-3 simulated as well as without it. D11 is a claim about
reachability, and this is the change most likely to make it false.

**Q5. Must the guard land with M-3, or before it?** Answer with the two
orderings built, not by reasoning. D13 already suspects the recorded dependency
between #360 and #361 is backwards; this is the measurement that settles it, and
the answer is a sequencing instruction for whoever ships M-3.

**Q6. What happens to receiver state?** The curry carries capability state for
delegation to a callback literal evaluated in the same method invocation. A
guard that returns early runs **before** that delegation. Find out whether an
early return can drop a capability a program should have had, or carry one into
a handler body that should not have it. Treat a leak as the more serious of the
two and report it as an a07 concern, not as an ergonomic one. Nothing in the
record considers this, and it is the question a security review would ask first.

**Q7. Can a frame install a handler for code it did not write?** D1 makes the
handler an ordinary property and D2 finds it by ordinary outward lookup, so a
frame in the lookup chain — including one a program received as data — appears
to be able to substitute values for failures below it. Establish whether it can.
If it can, the reserved-namespace question in the record's second Open item is a
security decision rather than a naming one, and a07's threat model should get
it.

## 4. Report regardless of outcome

- **The guard, stated as a ruling** — what it tests, what it answers, and where
  it sits relative to capability delegation. One paragraph a reader could
  implement from without rereading this brief.
- **The ordering instruction for #361**, with both orderings measured.
- **Whether Q3 makes the two framings composable.** This is the answer most
  likely to change what the project does next, so give it its own heading even
  if the answer is that they do not compose.
- **Anything in D1–D13 the site contradicts.** Both prior spikes contradicted
  their own briefs' premises and were better for it. The record has been revised
  three times against measurement; a fourth is not a failure.

## 5. Deliverables

Same rule as [`02`](02-recovery-spike.md) §5 and
[`04`](04-masking-bound-spike.md) §7, for the same reason: the code dies, the
findings do not.

**Code, tests, and corpus → branch `a13-09-combination-guard`, off
`a13-error-handling`.** Push it; do not merge it, do not open a PR, do not
rewrite existing commits. The old letter-suffixed branch names belonged to the
letter-suffixed documents; this folder is numbered now, and the branch follows
the document.

**Findings → `spec/a13-error-handle/10-combination-guard-findings.md`, committed
onto `a13-error-handling` itself**, as a single commit touching that one file.
Head it with a `**Status:**` line naming the spike commit the findings were
taken at, then one second-level heading per question, Q1 through Q7, headed
exactly that way. Real pasted output throughout — the prior findings set that
standard.

**Scratch corpus → `cli/hc/combination-guard.hc`, left unregistered**, so
neither doctest harness globs it.

Leave [`../a13-error-handle.md`](../a13-error-handle.md) and this file unedited.
The record is revised deliberately, in its own commit, after the findings land.

## 6. Out of scope

- **D1–D13 as rulings.** The mechanism, the masking identity split, the decline
  vocabulary, the text argument, and the collecting opt-out are all settled and
  were each attacked already. Do not re-measure them except where a question
  above points at one.
- **Choosing the handler's word.** `.on-fail` against `.$recover` is a naming
  decision the record holds open, and Q7 informs it without settling it. Use any
  identifier that lexes.
- **Regularizing the refusal vocabulary**, and building a failure frame. Both
  are [`06`](06-applying-a-failure.md) §7's territory and larger than this.
- **Shipping M-3.** Simulate the gate; do not change `lib/ops/math.ts` on this
  branch.
- **Changing `lib/ops/conditionals.ts`.** Q4 asks what the operators answer, not
  for them to answer differently.

## 7. How this will be judged

1. Did the §2 configuration reproduce before anything else was built?
2. Is Q1 answered as a ruling rather than as a preference between two
   predicates?
3. Are Q2 and Q6 measured with effects and capabilities, not with values?
4. Does Q3 get a real attempt, including the composition that would make the
   record's third Open item smaller?
5. Is the #361 ordering an instruction someone could follow?
