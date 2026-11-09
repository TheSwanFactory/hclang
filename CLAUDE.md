# Homoiconic C (HC): rules for this repository

CLAUDE.md files hold policy and procedures that the code cannot tell you. How
the interpreter is built is in [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md);
anything the code itself states, such as which files, classes or operators
exist, should be read from the code, never recorded here.

## Development Workflow

### Running Tests

```bash
deno task test              # Run all tests
deno task test:cli          # Test CLI package
deno task test:lib          # Test library package
deno task test:web          # Test web package
deno task test:compiled     # Build the CLI binary and run it from an empty dir
```

### Code Quality

```bash
deno fmt                    # Format code
deno lint --fix             # Lint and fix issues
deno task setup             # Install pre-commit hooks
```

### Building

```bash
deno task build             # Build the CLI, npm package, and offline web artifact
```

## Language Rulings

### Delimiter Families

A delimiter earns its keep only when it changes what the delimited text denotes:

| Delimiter | Denotes                              |
| --------- | ------------------------------------ |
| `“ ”`     | the characters, canonical spelling   |
| `" "`     | the characters, ASCII input spelling |
| `'…'`     | a resource outside the program       |
| `` ` ``   | foreign content, verbatim GFM prose  |
| `#…#`     | a comment, which is also a string    |

### Iteration

`hc/apply-tutorial.md` teaches iteration and `hc/apply.hc` is its executable
corpus ([design](doc/ARCHITECTURE.md#iteration)). Before v0.15.0 `|` and `&`
were assigned the other way around, so older papers and specs read reversed.

## Bundled `hc/` Files

Every host that installs a root, the CLI and `HCLang` (and so the playground),
lays the top-level `hc/` folder over it read-only. Those files are ordinary HC
programs, modules and testdocs alike, and the package ships all of them so a
session can include any one with `<-`: `Figures <- './hc/figures.hc'` imports
`hc/figures.hc`. Nothing is in scope until a program imports it. The sources are
compiled in from the generated, committed `lib/bundle/hc-sources.ts`, so after
adding, editing, or removing an `hc/*.hc`, run `deno task bundle:embed` and
commit the result. Git is the drift check: `deno task bundle:check` regenerates
the embed and fails on any difference, and both the pre-commit hook and
`test:all` run it. A bare `evaluate` has no root, so it imports nothing, bundled
or otherwise. The one exception is the Denum class that `.####` answers, which
the evaluator reads from `hc/denum.hc` in the embed, in a namespace of its own
(`lib/execute/denum-prologue.ts`), so that file's code must not import.

## Project Guidelines

### Code Organization

- **lib/** - Pure, reusable library code
- **cli/** - Command-line interface wrapping lib
- **web/** - Web interface wrapping lib
- Keep lib/ independent of cli/ and web/

### Testing Standards

- Write tests for all new functionality
- Each file should have a corresponding `.test.ts`
- Use `@std/expect` for assertions
- Aim for high coverage

### Documentation

- CLAUDE.md files hold only policy and non-obvious procedure. Never add file
  indexes, operator lists or other facts the code already states; they go stale,
  and the code is the authority.
- Record design and its rationale in `doc/ARCHITECTURE.md` or a `spec/` file.
- Keep README.md in sync with capabilities
- Document public APIs in JSDoc comments

### Style Guide

- Use TypeScript strict mode
- Prefer explicit return types
- Use descriptive variable names
- Keep functions small and focused
- Follow Deno style guide

## Common Development Tasks

### Adding a Language Feature

1. Read [the pipeline design](doc/ARCHITECTURE.md#pipeline)
2. Register source starts with the owning Frame's static `SIGIL_STARTS`
3. Publish a static `SYNTAX` descriptor with `recognize`, `finish`, and
   `fromSource`, composing the shared rules in `lib/frames/atom-syntax.ts`
4. Add structural actions in `lib/execute/terminals.ts` when applicable
5. Register the descriptor in `lib/execute/syntax.ts`
6. Implement evaluation in `lib/execute/hc-eval.ts` or `lib/execute/hc-lang.ts`
7. Add tests at each affected boundary

### Adding a Built-in Operation

1. Implement it as a Frame subclass in the fitting `lib/ops/` module
2. Register it in the language context
3. Add tests

### Adding a Frame Type

1. Read the invariants in [lib/frames/CLAUDE.md](lib/frames/CLAUDE.md)
2. Extend the appropriate base class (Frame, FrameAtom, etc.)
3. For source syntax, follow Adding a Language Feature
4. Implement `toString()` and `toStringArray()`
5. Add tests

## Publishing

### Version Management

```bash
deno task bump              # Bump the patch version everywhere and commit
deno task bump --minor      # Bump the minor version instead, resetting the patch
```

The task updates the five `deno.json` files and `lib/version.ts`, runs
`deno install`, then stages and commits the result. Any other argument is
refused rather than ignored.

### Publishing packages, releases, and the online demo

Merge the PR to the `master` branch. GitHub Actions compares the version in
`deno.json` with the version before the merge. When the version changed, it
publishes hclang and hcweb to JSR, publishes the tested hclang npm tarball, and
creates a GitHub Release tagged `v<version>` with generated notes and the tested
`hcweb.html` download. Merges without a version bump do not publish packages,
create a release, or deploy the demo; no manual tag is required.

The release workflow uploads `web/dist/` to GitHub Pages and verifies the public
page's version, source commit, and HC evaluation in Chromium. A separate
`demo-availability.yml` workflow runs the browser check daily and on manual
dispatch. Offline artifact tests alone cannot detect a production DNS or hosting
failure. Keep the production check separate from the local `test:all` gate.

The online demo is
[theswanfactory.github.io/hclang](https://theswanfactory.github.io/hclang/).
Select **GitHub Actions** as the repository's Pages source and allow `master` in
the `github-pages` environment before the first deployment. Disconnect the old
Deno Deploy GitHub integration so it stops posting obsolete deployment statuses.
See
[web publishing and monitoring](web/README.md#how-the-release-artifact-is-built)
for setup and local smoke-test commands.

### VS Code Extension

```bash
deno task vscode:package    # Create .vsix file
deno task vscode:publish    # Publish to marketplace
deno task vscode:install    # Install locally
```

The extension versions independently of the runtime packages, in
`vscode-extension/package.json`. GitHub Actions publishes it the same way it
publishes to JSR: when a merge to `master` changes that version, the workflow
runs `deno task vscode:publish` after the full test suite passes. Merges that
leave the version alone do not publish.

The three tasks pin `@vscode/vsce` to an exact version rather than resolving npm
`latest`, because the publish task runs with a Marketplace credential: an
unpinned resolve would hand that token to whatever upstream released most
recently, with no change or review here. Bump the version in all three tasks
together, deliberately.

Publishing authenticates with a Marketplace personal access token, read from the
`VSCE_PAT` repository secret. The token belongs to the `TheSwanFactory`
publisher and is minted at
[Azure DevOps](https://dev.azure.com/ErnestPrabhakar/_usersSettings/tokens);
these tokens expire within a year, so a publish that fails to authenticate
usually needs a fresh one rather than a workflow change. Rotate it with:

```bash
gh secret set VSCE_PAT   # paste or pipe the token on stdin, never as an argument
```

Publishing a version the Marketplace already has is refused, so the version must
be bumped before the merge. To publish a version the automation would otherwise
skip, run the workflow manually from the Actions tab with **Publish the VS Code
extension** checked. Running `deno task vscode:publish` locally also works and
needs `VSCE_PAT` exported in the shell.
