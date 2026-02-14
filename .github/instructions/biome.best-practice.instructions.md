---
description: 'Biome formatter and linter best practices for JavaScript/TypeScript projects'
applyTo: 'biome.json, biome.jsonc, **/*.{js,ts,jsx,tsx,json}'
---

# Biome Best Practices

Guidelines for using Biome as a high-performance code quality tool (13x faster than ESLint + Prettier).

## Purpose and Scope

Use Biome for formatting, linting, and import organization in JavaScript/TypeScript projects.
Apply these rules to configuration files and source code managed by Biome.

## Project Overview

**Tool**: Biome - Rust-based formatter/linter with 97% Prettier compatibility
**Performance**: Processes 450 files in 2.9 seconds (vs 38 seconds for ESLint + Prettier)
**Integration**: Single tool replaces ESLint + Prettier + import organizers

## Core Principles

### Priority Order
1. Security: Never disable security-related rules without explicit justification
2. Performance: Exclude build artifacts and node_modules explicitly
3. Team consistency: Use `--save-exact` for version locking
4. VCS integration: Enable `.gitignore` respect automatically
5. CI/CD: Use read-only checks in CI (see CI/CD Integration)

### Minimal Changes Principle
Preserve existing code structure unless formatting/linting requires changes.
Prefer running checks only on changed files (see Commands).


## Installation and Setup

### Install with Version Locking
```bash
npm install --save-dev --save-exact @biomejs/biome
```
**Rationale**: Prevents subtle behavior differences across team members and CI environments.

### Initialize Configuration
```bash
npx @biomejs/biome init        # JSON format
npx @biomejs/biome init --jsonc  # JSONC with comments
```

## Configuration File (biome.json)

### Required Fields
Include `$schema` for IDE autocomplete and validation.
Enable VCS integration to respect `.gitignore` automatically.
Enable recommended linter rules as baseline (see Linting Rules).

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.5/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "indentWidth": 2,
    "lineWidth": 80
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

### Exclude Build Artifacts
Exclude build artifacts, dependencies, and generated files. For a full
include list, see "Performance Optimization → Exclude Non-Source
Directories."
```json
{
  "files": {
    "includes": ["src/**", "!**/dist/**", "!**/node_modules/**"]
  }
}
```
**Rationale**: Improves performance and prevents linting generated code.

## Formatting Rules

### Use Biome Defaults
Minimize configuration to reduce team bikeshedding.
Override only when project conventions require deviation.

| Option | Default | Description |
|--------|---------|-------------|
| `indentStyle` | `"tab"` | Use tabs or spaces |
| `indentWidth` | `2` | Spaces per indent level |
| `lineWidth` | `80` | Line wrap column |
| `lineEnding` | `"lf"` | Unix-style line endings |

### JavaScript-Specific Options
```json
{
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  }
}
```

### Suppress Formatting Selectively
```javascript
// biome-ignore format: Matrix layout must be preserved for readability
const matrix = [
  (2 * n) / (r - l), 0, (r + l) / (r - l), 0,
  0, (2 * n) / (t - b), (t + b) / (t - b), 0,
];
```
**Rule**: Always provide specific justification in `biome-ignore` comments.

## Linting Rules

### Enable Recommended Rules
```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noDebugger": "error",
        "noConsoleLog": "warn"
      },
      "style": {
        "useConst": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  }
}
```

### Severity Levels
- `"error"`: Fails CI (use for correctness and security issues)
- `"warn"`: Informational (use for style preferences)
- `"info"`: Low priority suggestions
- `"off"`: Disable rule completely

### Suppress Linting with Justification
```javascript
// biome-ignore lint/suspicious/noDebugger: Debugging production issue #1234
debugger;

// biome-ignore lint/suspicious/noConsoleLog: Required for troubleshooting logs
console.log("User action:", action);
```
**Rule**: Apply the same justification requirement as formatting suppressions.

## Commands

### Unified Check Command
```bash
biome check --write ./src          # Format, lint, organize imports
biome check --write --changed      # Only changed files
biome check --write --staged       # Only staged files
biome ci ./src                     # CI mode (read-only, fails on issues)
```
**Rationale**: Single command reduces complexity and ensures consistency.

### Format-Only Commands
```bash
biome format ./src                 # Check formatting only
biome format --write ./src         # Apply formatting
```

### Lint-Only Commands
```bash
biome lint ./src                   # Check linting only
biome lint --write ./src           # Apply safe fixes
biome lint --write --unsafe ./src  # Apply unsafe fixes (caution)
```

### Recommended package.json Scripts
```json
{
  "scripts": {
    "check": "biome check .",
    "check:write": "biome check --write .",
    "check:ci": "biome ci .",
    "format": "biome format --write .",
    "lint": "biome lint --write ."
  }
}
```

## Editor Integration

### VS Code Configuration
Install official Biome extension (`biomejs.biome`).
Configure `.vscode/settings.json` for team consistency.

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## CI/CD Integration

### GitHub Actions
Use official `biomejs/setup-biome` action for optimal caching.

```yaml
name: Code Quality
on: [push, pull_request]

jobs:
  biome:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: biomejs/setup-biome@v2
        with:
          version: latest
      - run: biome ci .
```
**Rationale**: Official action provides better performance and caching.

### Common CI Mistakes to Avoid
```yaml
# Bad: Using --write in CI (modifies files)
- run: biome check --write .

# Good: Using ci command (read-only)
- run: biome ci .
```

## Git Hooks

### Pre-commit with Husky and lint-staged
```json
{
  "scripts": {
    "prepare": "husky"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx,json}": [
      "biome check --write --no-errors-on-unmatched"
    ]
  }
}
```

**.husky/pre-commit:**
```bash
npx lint-staged
```

## Migration from ESLint/Prettier

### Automated Migration
```bash
biome migrate eslint --write              # Migrate ESLint config
biome migrate eslint --write --include-inspired  # Include inspired rules
biome migrate prettier --write            # Migrate Prettier config
```

### Gradual Adoption Strategy
1. Enable formatter first, keep existing linter
2. Enable linter rules at `"warn"` level
3. Gradually promote warnings to errors
4. Remove ESLint/Prettier after validation

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": "warn"
    }
  }
}
```

### Parallel Operation During Migration
**.eslintrc.json:**
```json
{
  "ignorePatterns": ["src/**"]
}
```

**.prettierignore:**
```
src/**
```

## Performance Optimization

### Exclude Non-Source Directories
Explicitly exclude build artifacts, dependencies, and generated files.

```json
{
  "files": {
    "includes": [
      "src/**",
      "!**/dist/**",
      "!**/build/**",
      "!**/node_modules/**",
      "!**/.next/**",
      "!**/coverage/**",
      "!**/.git/**"
    ]
  }
}
```

### Investigate Performance Issues
```bash
biome check --log-level=tracing --log-kind=json --log-file=biome.log ./src
```

### Limit Project-Scope Rules
```json
{
  "linter": {
    "rules": {
      "project": {
        "noFloatingPromises": "off"
      }
    }
  }
}
```
**Rationale**: Project-scope rules require full type checking and impact performance.

## Monorepo Configuration

### Use Overrides for Package-Specific Rules
```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "overrides": [
    {
      "include": ["packages/logger/**"],
      "linter": {
        "rules": {
          "suspicious": {
            "noConsoleLog": "off"
          }
        }
      }
    },
    {
      "include": ["packages/ui/**"],
      "javascript": {
        "formatter": {
          "semicolons": "asNeeded"
        }
      }
    }
  ]
}
```

### Configuration Inheritance
```json
{
  "extends": ["../biome.json"],
  "formatter": {
    "indentStyle": "space"
  }
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Formatting not applied | Verify `editor.defaultFormatter` in VS Code settings |
| Specific files ignored | Check `files.includes` patterns in biome.json |
| Slow performance | Add exclusions to `files.includes`, investigate with `--log-level=tracing` |
| CI failures | Use `biome ci` command instead of `biome check --write` |
| Configuration not loaded | Verify `$schema` field, clear editor cache |

## Anti-Patterns

### Missing Configuration Schema
```json
// Bad: No schema
{
  "formatter": {
    "enabled": true
  }
}

// Good: With schema for IDE support
{
  "$schema": "https://biomejs.dev/schemas/2.0.5/schema.json",
  "formatter": {
    "enabled": true
  }
}
```

### Disabled VCS Integration
```json
// Bad: VCS integration disabled
{
  "vcs": {
    "enabled": false
  }
}

// Good: VCS integration enabled
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

### Using --write in CI
```bash
# Bad: Modifies files in CI
biome check --write .

# Good: Read-only check in CI
biome ci .
```

### Ignoring Without Justification
```javascript
// Bad: No reason provided
// biome-ignore lint
console.log("debug");

// Good: Specific justification
// biome-ignore lint/suspicious/noConsoleLog: Required for debugging issue #1234
console.log("debug");
```

## References

- [Biome Official Documentation](https://biomejs.dev/)
- [Biome Playground](https://biomejs.dev/playground)
- [GitHub: biomejs/biome](https://github.com/biomejs/biome)
- [Biome vs Prettier Differences](https://biomejs.dev/formatter/differences-with-prettier)
