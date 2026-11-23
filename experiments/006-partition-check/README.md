# 006.17 — the partition rule as an executable model

An executable model of the §6 partition rule of Occurrence Figure 006.17
(occurrence/history). No document in this repository holds Figure 006.17; read
it there. The rule:

> A mutable dependency that crosses a proposed partition boundary without an
> explicit effect boundary is a partitioning error.

It is not part of the shipped runtime. #475 added it as
`lib/frames/partition-check.ts`, and nothing in the evaluator called it: HC has
no partitioned or distributed execution, so nothing produces the `PartitionPlan`
that `checkPartitions` takes. #520 moved it here, out of `lib/` and its
`lib/frames.ts` re-export. It belongs back in `lib/` once partitioned execution
exists.

```sh
deno task test:partition-check   # 1 test (8 steps), also part of test:all
```

| File                      | Role                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `partition-check.ts`      | `partitionPlan` places values in partitions; `checkPartitions` accepts local and transactional dependencies and rejects a cross-partition mutable one unless an `A -> C` effect boundary notifies its own observer.              |
| `partition-check.test.ts` | Local, unplaced, crossing, covered and transactional dependencies; every offending edge reported; coverage read from the live effect registry or from explicit `arrows`; and coverage specific to the observer (PR #475 review). |

By default the check reads coverage from the live effect registry through
`isEffectObserver` in `lib/frames/effect-registry.ts`. A caller can pass the
explicit `[managed, observer]` arrows of a plan instead, which needs no
registry.
