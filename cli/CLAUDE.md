# cli: rules for editing

## Writing testdocs

Pair a value-returning `; source` with `# expected`. An expression that ends in
the HC `;` terminal is a statement. It intentionally has no expectation and is
not counted as an assertion. For an evaluated example whose correct value isn't
implemented yet, write `# $!.unimplemented Correct-Value`. A differing or
missing result then counts as unimplemented, and producing `Correct-Value` fails
until the marker is removed. Comment out examples that must not be evaluated.

`deno task test:doc` discovers files in `hc/` automatically: an HC shebang
(`#!/usr/bin/env hc`) plus at least one adjacent `; source` / `# expected` pair
marks a testdoc. Every discovered file runs in an independent evaluator session,
in sorted filename order. Do not add filenames to a task manifest. Files without
executable expectations remain ordinary HC modules or examples. A new HC file
with expectation pairs but without the HC shebang is rejected instead of
silently skipped. The legacy exceptions are listed in `cli/test-docs.ts`.

After a change that adds, removes or un-implements a claim in a bundled testdoc,
run `cd cli && deno task testdoc:summaries` and commit the regenerated
`cli/testdoc-summaries.json`; `cli/hc.test.ts` reads each expected summary from
it.

## The compiled binary

The binary needs no extra assets, because the bundled `hc/` files are compiled
into it. `deno task test:compiled` (part of `test:all`) builds it and imports
Figures from an empty working directory.

## Permission flags are a derived artifact

The `hc` and `build` tasks run with
`--allow-read --allow-write --allow-env
--deny-run --deny-ffi`. That list
belongs to **this** harness and is not the security model: `hcweb.html` is a
harness with no permission flags to express, and it relies on the same
confinement. Treat the flags as a floor derived from what the harness needs,
never as the boundary.

- `--allow-env` does not bound what a program sees. The dictionary in
  `lib/execute/env-visibility.ts` does, and the CLI reads one declared name at a
  time through it. The flag stays unscoped because the dependency tree probes
  the colour-support family, which a per-invocation flag cannot express.
- `--allow-read` and `--allow-write` are wider than any program's reach. A
  resource identifier resolves against the root binding, a fresh temp directory,
  so the language enforces a ceiling inside whatever the process holds.
- The root also overlays the bundled `hc/` files, read-only (see the root
  CLAUDE.md). They are compiled into the program, so no file is read, no flag or
  root widens, and every other path stays in the temp root.
- `--deny-run` and `--deny-ffi` are a hard floor, because `--deny-*` beats
  `--allow-*` and either authority would void every path scope above.
- Which schemes can reach a host is decided by `getHandlers()`, not by a flag.
- `$$.dispatch` is part of the host surface of **every** program the CLI runs,
  not only `-t` testdocs. It grants no authority: each event is a closure the
  program already holds, run with the authority it already has. `HCLang`
  sessions install the same bridge, so a bundled testdoc that dispatches runs in
  the playground too.
