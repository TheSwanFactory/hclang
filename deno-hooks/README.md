# Deno Hooks

A zero-dependency git hooks framework for Deno projects.

## Features

- 🦕 **Pure Deno/TypeScript** - No external dependencies
- ⚡ **Fast** - Parallel hook execution
- 🎯 **Simple** - Declarative YAML/JSON configuration
- 🔒 **Secure** - Local hooks only, Deno permission model
- 🛠️ **Built-in Hooks** - Common checks work out-of-the-box

## Quick Start

### 1. Create Configuration

Create `deno-hooks.yml` in your project root:

```yaml
hooks:
  pre-commit:
    - id: deno-fmt
      glob: "*.{ts,js,json,md}"
      pass_filenames: true

    - id: deno-lint
      glob: "*.{ts,js}"
      pass_filenames: true

  pre-push:
    - id: test
      run: "deno test -A"
```

### 2. Install Hooks

```bash
deno run -A deno-hooks/install.ts
```

### 3. Commit!

```bash
git commit -m "Your changes"
# Hooks run automatically
```

## Configuration

### Hook Definition

```yaml
hooks:
  <hook-name>:  # e.g., pre-commit, pre-push
    - id: <hook-id>          # Unique identifier
      name: <display-name>   # Optional display name
      run: <command>         # Command to run or built-in hook name
      glob: <pattern>        # File pattern (e.g., "*.ts")
      pass_filenames: true   # Pass matched files as arguments
      exclude: <pattern>     # Exclude pattern
```

### Built-in Hooks

- `deno-fmt` - Format code with `deno fmt`
- `deno-lint` - Lint code with `deno lint`
- `deno-test` - Run tests with `deno test`

### Custom Hooks

```yaml
hooks:
  pre-commit:
    - id: custom-check
      run: "deno run -A scripts/my-check.ts"
      glob: "*.ts"
      pass_filenames: true
```

## Development Status

**Version**: 0.1.0 (MVP)
**Status**: In development

This is currently being developed as part of the [hclang](https://github.com/TheSwanFactory/hclang) project and will be extracted to its own repository once stable.

## License

MIT
