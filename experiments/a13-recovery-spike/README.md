# a13 recovery spike

Research code for spec
[a13/13](../../spec/a13-error-handle/13-recovery-spike-findings.md). It is not
part of the shipped runtime and not wired into `deno task test:all`. It changes
nothing under `lib/`: variant B replaces `FrameExpr.evaluateTerms` at runtime,
only while a test has it installed.

```sh
deno test experiments/a13-recovery-spike
```

| File            | Role                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spike.ts`      | The observation a handler receives (`Observation`), variant A (`Recover`, a host-bound receiver spelled `$$.recover {E} H`), variant B (`installCatchBoundary`, the infix `E catch H`), and the control `EagerCatcher`. |
| `spike.test.ts` | The conformance matrix of specs 12, 12a, 12b and 12c, run against both variants, plus a check that variant B leaves expressions without `catch` unchanged.                                                              |

`catch` and `$$.recover` are placeholder spellings; spec 11 §8 leaves the real
one open.
