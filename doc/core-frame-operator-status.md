# Core frame operator status

This inventory classifies the white-paper semantics covered by issue #296.

| Area                                            | Status       | Focused follow-up                                                                      |
| ----------------------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| Whole/data/metadata equality (`=`, `==`, `===`) | Implemented  | Extend equality to new frame kinds as they are introduced.                             |
| Enumerable map and reduce (`                    | `,`&`)       | Implemented                                                                            |
| Nil conditionals (`?`, `:`)                     | Implemented  | None. Both nil and non-nil dispatch are covered by evaluator tests.                    |
| Program exit (`$$`)                             | Aspirational | Specify the host exit value and CLI boundary before implementation.                    |
| Scope returns (`$<`, `$<<`)                     | Aspirational | Specify scope boundaries and multi-level unwinding before implementation.              |
| Missing-name exceptions                         | Implemented  | Preserve propagation tests as additional exception kinds are added.                    |
| General exception propagation and handlers      | Aspirational | Specify handler matching and interrupt unwinding independently of missing-name lookup. |

The aspirational controls remain prose-only in the white paper. They should not
be treated as executable syntax until their boundary and unwinding rules are
specified and focused tests can be added.
