# lib/execute: rules for editing

The design of the pipeline is in
[doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md#pipeline).

- **A testdoc's exports belong in code, never in an example.** Importing a
  testdoc runs its code but drops its example lines (those starting with a
  semicolon and a space), so a name declared only in an example is missing for
  every importer. An error in a testdoc's code passes when the file runs
  directly but fails every import. The `HCLang` bundle test in `hc-lang.test.ts`
  imports Figures to catch this.
- **Resource reads are never cached.** `FrameResource.elements()` is read once
  per import evaluation. The import-cycle chain is invocation-local, not a
  module registry.
- **Add parser-dependent behavior through a late-bound hook.** `lib/frames` and
  `lib/ops` cannot import this package, so such behavior is installed from here
  (`FrameLazy.quote`, `installDenumConstructor`).
