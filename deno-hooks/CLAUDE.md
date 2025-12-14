# Deno Hooks - Developer Guide

## Overview

Deno Hooks is a zero-dependency git hooks framework built in pure TypeScript for Deno projects. It provides a declarative way to configure and run git hooks without requiring Python (pre-commit) or Node.js (Husky) dependencies.

## Architecture

### Components

```
deno-hooks/
├── mod.ts              # Main exports
├── config.ts           # Configuration parsing (YAML/JSON)
├── install.ts          # Git hooks installer
├── run.ts              # Hook runner (called by git)
├── executor.ts         # Hook execution logic
├── files.ts            # File utilities (staged files, glob matching)
├── hook.ts             # Type definitions
└── test-hook.test.ts   # Tests
```

### How It Works

1. **Installation** (`install.ts`)
   - Reads configuration from `deno-hooks.yml` or `deno.json`
   - Creates shell wrapper scripts in `.git/hooks/`
   - Makes scripts executable

2. **Git Hook Trigger**
   - Git calls the shell wrapper (e.g., `.git/hooks/pre-commit`)
   - Wrapper executes `deno run -A deno-hooks/run.ts pre-commit`

3. **Hook Execution** (`run.ts`)
   - Loads configuration
   - Gets relevant files (staged for pre-commit)
   - Filters files by glob patterns
   - Executes each configured hook
   - Reports results

4. **Built-in Hooks** (`executor.ts`)
   - `deno-fmt`: Format with `deno fmt`
   - `deno-lint`: Lint with `deno lint`
   - `deno-test`: Run `deno test -A`

## Configuration

### YAML Format (deno-hooks.yml)

```yaml
hooks:
  pre-commit:
    - id: deno-fmt
      name: deno fmt
      run: deno-fmt
      glob: "*.{ts,js,json,md}"
      pass_filenames: true

    - id: deno-lint
      name: deno lint
      run: deno-lint
      glob: "*.{ts,js}"
      pass_filenames: true

  pre-push:
    - id: test
      name: test
      run: deno-test
      pass_filenames: false
```

### JSON Format (deno.json)

```json
{
  "deno-hooks": {
    "hooks": {
      "pre-commit": [
        {
          "id": "deno-fmt",
          "run": "deno-fmt",
          "glob": "*.{ts,js,json,md}",
          "pass_filenames": true
        }
      ]
    }
  }
}
```

### Hook Options

- `id` (required): Unique identifier
- `name` (optional): Display name (defaults to id)
- `run` (required): Built-in hook name or shell command
- `glob` (optional): File pattern to match (e.g., `*.ts`)
- `pass_filenames` (optional): Pass matched files as arguments
- `exclude` (optional): Exclude pattern
- `parallel` (optional): Allow parallel execution (not yet implemented)

## Built-in Hooks

### deno-fmt

Formats code with `deno fmt`. Runs in check mode first, then auto-formats if needed.

```yaml
- id: fmt
  run: deno-fmt
  glob: "*.{ts,js,json,md}"
  pass_filenames: true
```

### deno-lint

Lints code with `deno lint`. Reports errors without auto-fixing.

```yaml
- id: lint
  run: deno-lint
  glob: "*.{ts,js}"
  pass_filenames: true
```

### deno-test

Runs tests with `deno test -A`. Typically used in pre-push hooks.

```yaml
- id: test
  run: deno-test
  pass_filenames: false
```

## Custom Hooks

You can run any command as a hook:

```yaml
hooks:
  pre-commit:
    - id: custom-check
      run: "deno run -A scripts/my-check.ts"
      glob: "*.ts"
      pass_filenames: true
```

The command will be executed with matched files as arguments if `pass_filenames: true`.

## File Filtering

### Glob Patterns

Supports glob patterns with brace expansion:

- `*.ts` - All TypeScript files
- `*.{ts,js}` - TypeScript and JavaScript files
- `**/*.test.ts` - Test files (not yet supported, needs implementation)

### Staged Files

For `pre-commit` hooks, only staged files are processed. This is determined by:

```bash
git diff --cached --name-only --diff-filter=ACM
```

Files are then filtered by the glob pattern specified in each hook.

## Development

### Running Tests

```bash
cd deno-hooks
deno test -A
```

### Manual Testing

```bash
# Install hooks
deno run -A install.ts

# Run hooks manually
deno run -A run.ts pre-commit

# Check installed hooks
cat .git/hooks/pre-commit
```

### Adding a Built-in Hook

1. Add function to `executor.ts`:
   ```typescript
   async function myHook(ctx: HookContext): Promise<HookResult> {
     // Implementation
   }
   ```

2. Register in `getBuiltInHook()`:
   ```typescript
   const builtIns = {
     "my-hook": myHook,
     // ...
   };
   ```

3. Use in configuration:
   ```yaml
   - id: my-check
     run: my-hook
   ```

## Current Limitations (MVP)

1. **Sequential Execution**: Hooks run one at a time (parallel execution planned for Phase 2)
2. **Limited Built-ins**: Only fmt, lint, test (more planned)
3. **Simple Glob Matching**: No `**` or complex patterns yet
4. **No Hook Dependencies**: Can't specify hook execution order
5. **Auto-fix Staging**: Formatted files not automatically re-staged

## Future Enhancements

### Phase 2 (Planned)

- Parallel hook execution
- More built-in hooks (check-yaml, trailing-whitespace, etc.)
- Better glob pattern support (`**/*.ts`)
- Hook dependencies and ordering
- Auto-restaging for auto-fix hooks
- Skip hooks via environment variable

### Phase 3 (Future)

- Publish to JSR as `@data-yaml/deno-hooks`
- Extract to separate repository
- CI/CD integration guides
- Migration tool from pre-commit
- Community hook sharing

## Migration from pre-commit

### Before (pre-commit)

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: lint
        name: lint
        entry: bash -c "deno fmt && deno lint --fix"
        language: system
        pass_filenames: false
```

### After (deno-hooks)

```yaml
# deno-hooks.yml
hooks:
  pre-commit:
    - id: deno-fmt
      run: deno-fmt
      glob: "*.{ts,js,json,md}"
      pass_filenames: true
    - id: deno-lint
      run: deno-lint
      glob: "*.{ts,js}"
      pass_filenames: true
```

### Benefits

- No Python dependency
- Faster startup (~100ms vs ~500ms)
- Native Deno integration
- Type-safe configuration
- Simpler installation

## Troubleshooting

### Hooks Not Running

Check that hooks are installed:
```bash
ls -la .git/hooks/pre-commit
cat .git/hooks/pre-commit
```

Reinstall if needed:
```bash
deno task setup
```

### Configuration Errors

Validate configuration:
```bash
deno run -A deno-hooks/run.ts pre-commit
```

Check YAML syntax:
```bash
deno eval "import { parse } from '@std/yaml'; console.log(parse(await Deno.readTextFile('deno-hooks.yml')))"
```

### Hooks Passing When They Shouldn't

Check that files match glob patterns:
```bash
# Get staged files
git diff --cached --name-only

# Test pattern matching
deno eval "import { filterFiles } from './deno-hooks/files.ts'; console.log(filterFiles(['foo.ts', 'bar.js'], '*.ts'))"
```

## Resources

- **Spec**: [doc/spec/2-deno-hooks/README.md](../doc/spec/2-deno-hooks/README.md)
- **Git Hooks**: [git-scm.com/docs/githooks](https://git-scm.com/docs/githooks)
- **Pre-commit** (inspiration): [pre-commit.com](https://pre-commit.com/)
