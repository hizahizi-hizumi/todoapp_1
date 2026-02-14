---
description: 'Best practice rules for projects using Bun (runtime/package manager/test runner/bundler) to enhance reproducibility, security, and operational excellence'
applyTo: '**/package.json, **/bun.lock*, **/bunfig.toml, **/*.ts, **/*.tsx, **/*.js, **/*.jsx, **/*.mjs, **/*.cjs, **/*.cts, **/*.mts, Dockerfile, **/Dockerfile.*, **/.github/workflows/**/*.yml, **/.github/workflows/**/*.yaml'
---

# Bun Best Practices (for Copilot)

## Purpose and Scope

Ensure reproducibility, security, and maintainability when GitHub Copilot generates or updates code, configuration, and CI using Bun.

**Applicable Scope**: All projects using Bun as runtime, package manager, test runner, or bundler.

## Core Principles

### Reproducibility
- Keep `bun.lock*` committed and frozen in CI for reproducible installs

**Rationale**: Lock files guarantee identical dependency versions across all environments, preventing "works on my machine" issues.

### Security
- Restrict lifecycle scripts and `trustedDependencies` to reviewed packages

**Rationale**: Malicious or compromised packages can execute arbitrary code during installation, posing security risks.

### Type Safety Separation
- Run explicit type checking separate from execution

### Monorepo Integrity
- Align workspace and linker assumptions across team
- Prevent phantom dependencies in monorepo setups
- Use workspace protocol for inter-package dependencies

### Environment Configuration
- Avoid relying on `.env` auto-loading in production
- Inject environment variables explicitly in CI/production

## Dependencies and CI

### Installation Commands
- Use `bun ci` or `bun install --frozen-lockfile` in CI environments
- Never use plain `bun install` in CI pipelines

**Rationale**: Plain `bun install` may update lock files, causing non-reproducible builds and unexpected dependency changes.

### Lock File Management
- Commit `bun.lock*` files to version control
- Configure CI to fail if lock files are modified
- Reject pull requests that modify lock files without justification

### Production Dependencies
- Use `--production` flag for production images and jobs
- Exclude devDependencies from production environments
- Verify production bundle size after dependency changes

**Rationale**: DevDependencies increase attack surface and deployment size unnecessarily in production.

**✅ Good Example**
```yaml
# .github/workflows/ci.yml (example)
- run: bun ci
- run: bunx tsc --noEmit
- run: bun test
```

**❌ Bad Example (may update lockfile in CI)**
```yaml
- run: bun install
```

## Security

### Lifecycle Scripts
- Avoid allowing lifecycle scripts indiscriminately
- List only necessary packages in `trustedDependencies`
- Require code review for `trustedDependencies` changes
- Document reason for each trusted dependency

**Rationale**: Lifecycle scripts execute arbitrary code during installation, enabling supply chain attacks.

### Protocol-Based Dependencies
- Exercise extreme caution with `file:` protocol dependencies
- Carefully review `link:` protocol dependencies
- Audit `git:` and `github:` protocol dependencies thoroughly
- Prefer npm registry packages over direct repository references

**Rationale**: Non-registry protocols bypass security scanning and version verification mechanisms.

### Supply Chain Protection
- Implement `minimumReleaseAge` to delay new package adoption
- Set reasonable age threshold (e.g., 3-7 days)
- Balance security with feature delivery needs

**Rationale**: Newly published packages may contain undiscovered vulnerabilities or be compromised.

### Dependency Overrides
- Use `overrides` only for emergency security fixes
- Document CVE numbers or compatibility issues for each override
- Remove overrides once upstream packages are updated
- Review overrides regularly (monthly recommended)

**✅ Good Example (minimal trust)**
```json
{
  "trustedDependencies": ["my-trusted-package"]
}
```

**✅ Good Example (emergency fix with overrides)**
```json
{
  "overrides": {
    "some-transitive-dep": "1.2.3"
  }
}
```

**❌ Bad Example (overly permissive)**
```json
{
  "trustedDependencies": ["*"]
}
```

## Workspaces and Monorepos

### Workspace Dependencies
- Use `workspace:*` protocol for inter-package dependencies
- Alternatively use `workspace:^` for semver-aware references
- Never use relative file paths for workspace dependencies
- Update all workspace references when moving packages

**Rationale**: Workspace protocol ensures proper dependency resolution and prevents version conflicts.

### Package Boundaries
- Import only from package entry points (main/exports)
- Never import from `src` or `dist` directories directly
- Maintain clear public API contracts between packages
- Treat each package as an independent module

**Rationale**: Direct imports bypass package boundaries, creating tight coupling and preventing independent versioning.

### Linker Configuration
- Explicitly configure linker (`isolated` or `hoisted`) in `bunfig.toml`
- Use same linker setting across all environments
- Document linker choice in project README
- Test with the configured linker before deployment

**Rationale**: Inconsistent linker settings cause phantom dependencies and environment-specific failures.

**✅ Good Example (workspace protocol)**
```json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "@acme/core": "workspace:*"
  }
}
```

**❌ Bad Example (breaking package boundaries)**
```ts
import { internalThing } from "../../packages/core/src/internal";
```

## Configuration Management

### Project Configuration
- Centralize project settings in `bunfig.toml`
- Commit `bunfig.toml` to version control
- Share configuration across entire team
- Document non-obvious configuration choices

### Environment Variables
- Treat `.env` files as development convenience only
- Inject environment variables explicitly in CI/production
- Never commit `.env` files containing secrets
- Use platform-specific secret management in production

**Rationale**: `.env` auto-loading is development-specific; production environments require explicit configuration.

### Secret Management
- Exclude secrets from code and bundles
- Use environment variables for all secrets
- Validate presence of required secrets at startup
- Rotate secrets regularly

### Disabling .env in Production
- Set `env = false` in `bunfig.toml` for production builds
- Prevent accidental `.env` file reliance
- Document environment variable requirements

**✅ Good Example (disable .env for CI/production)**
```toml
# bunfig.toml
env = false
```

## TypeScript Integration

### Type Checking Separation
- Never rely on Bun runtime for type safety
- Run explicit type checking in separate step
- Fail CI builds on type errors
- Type-check before committing code

**Rationale**: Bun executes TypeScript without type checking, deferring type errors to runtime.

### CI Type Checking
- Execute `bunx tsc --noEmit` in all CI pipelines
- Run type checking before running tests
- Configure strict TypeScript options
- Block merges on type check failures

### Development Workflow
- Add `typecheck` script to package.json
- Run type checking in watch mode during development
- Integrate type checking into pre-commit hooks
- Use editor TypeScript integration

### Type Definitions
- Install `@types/bun` in devDependencies
- Keep `@types/*` packages updated
- Remove unused type definition packages
- Document custom type definitions

**✅ Good Example**
```json
{
  "scripts": {
    "dev": "bun run src/index.ts",
    "typecheck": "bunx tsc --noEmit",
    "test": "bun test"
  }
}
```

**❌ Bad Example (no type checking)**
```json
{
  "scripts": {
    "check": "bun run src/index.ts"
  }
}
```

## Testing with Bun

### Test Runner
- Use `bun test` as primary test runner
- Prioritize test stability over speed
- Configure timeout for slow tests explicitly
- Run tests in CI with verbose output

### Flaky Test Prevention
- Use `--randomize` flag to detect order dependencies
- Set `--seed` value for reproducible test runs
- Isolate tests with shared state
- Document known flaky tests and mitigation strategies

**Rationale**: Order-dependent tests hide bugs and cause CI failures unrelated to code changes.

### Parallel Execution
- Serialize tests involving I/O operations
- Use test isolation for database tests
- Mock external service dependencies
- Avoid shared file system state

### Test Organization
- Group related tests in describe blocks
- Name tests descriptively (what and expected outcome)
- Place test files adjacent to source files or in `__tests__` directories
- Follow naming convention: `*.test.ts` or `*.spec.ts`

## Build Configuration

### Target and Format
- Explicitly specify `target` option (browser/node/bun)
- Explicitly specify `format` option (esm/cjs/iife)
- Match target to actual runtime environment
- Verify build output compatibility before deployment

**Rationale**: Implicit defaults may produce incompatible output for target environment.

### Environment Variable Inlining
- Minimize environment variable inlining during build
- Inline only public, non-sensitive values
- Document which variables are inlined
- Validate inlined values do not contain secrets

**Rationale**: Inlined variables become permanent in bundles and cannot be changed without rebuild.

### Build Optimization
- Enable minification for production builds
- Generate source maps for debugging
- Analyze bundle size regularly
- Split large bundles when appropriate

### Output Validation
- Test built artifacts in target environment
- Verify external dependencies resolve correctly
- Check bundle size against thresholds
- Validate no development code in production bundles

## Shell Execution Safety

### Input Sanitization
- Never pass user input directly to shell commands
- Validate and sanitize all external input
- Use parameterized execution when possible
- Prefer Bun APIs over shell commands

**Rationale**: Unsanitized input enables command injection attacks.

### Shell Script Best Practices
- Quote all variables in shell scripts
- Use `set -euo pipefail` for error detection
- Check exit codes explicitly
- Log command execution for debugging

### Subprocess Execution
- Use Bun's `$` template literal for safe execution
- Avoid `bash -c` with string concatenation
- Escape special characters properly
- Set appropriate timeout for subprocesses

## Docker Integration

### Base Images
- Use official `oven/bun` images
- Pin specific Bun version tags (not `latest`)
- Update base images regularly for security patches
- Document Bun version in Dockerfile comments

**Rationale**: Version pinning ensures reproducible builds; `latest` tag may introduce breaking changes.

### Dependency Caching
- Copy `package.json` and `bun.lock*` before source code
- Run `bun install` before copying application code
- Leverage Docker layer caching for dependencies
- Invalidate cache only when dependencies change

### Lock File Enforcement
- Always use `--frozen-lockfile` flag in Dockerfiles
- Fail builds if lock file is modified
- Never run plain `bun install` in images

### Multi-Stage Builds
- Use separate stages for build and runtime
- Install only production dependencies in final stage
- Use `--production` flag for runtime dependencies
- Copy only necessary artifacts to runtime stage

**Rationale**: Multi-stage builds reduce final image size and attack surface.

### Image Optimization
- Minimize layer count
- Remove unnecessary files before final stage
- Use `.dockerignore` to exclude files
- Scan images for vulnerabilities regularly

**✅ Good Example (copy dependencies first)**
```dockerfile
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
```

**❌ Bad Example (poor cache utilization)**
```dockerfile
COPY . .
RUN bun install
```

## Validation and Verification

### CI Pipeline Validation
- Ensure CI runs install, typecheck, and tests in order
- Verify all steps pass before merge
- Run linting before type checking
- Run tests with coverage reporting

### Dependency Changes
- Re-validate `trustedDependencies`, `overrides`, and `minimumReleaseAge` after dependency updates
- Run a security audit after dependency updates

### Pre-Commit Checklist
- Lock file committed if dependencies changed
- Type checking passes locally
- All tests pass
- No secrets in code or configuration
- Build succeeds for target environment

### Pre-Merge Checklist
- CI pipeline green
- Code review completed
- Security changes reviewed by security team
- Documentation updated
- Breaking changes documented in changelog

## Common Anti-Patterns

### Avoid: Ignoring Lock Files
**Bad**: Running `bun install` and not committing lock file changes
**Good**: Commit lock file changes immediately after dependency modifications

### Avoid: Trusting All Dependencies
**Bad**: Setting `trustedDependencies: ["*"]`
**Good**: List only necessary packages explicitly

### Avoid: Skipping Type Checking
**Bad**: Relying only on `bun run` for verification
**Good**: Always run `tsc --noEmit` in CI

### Avoid: .env in Production
**Bad**: Deploying `.env` files to production
**Good**: Inject environment variables through platform tools

### Avoid: Undefined Build Targets
**Bad**: Using default build settings
**Good**: Explicitly set `target` and `format` options

## Tool Versions

- Bun: >= 1.0.0 (specify exact version in CI)
- TypeScript: >= 5.0.0 (for modern type system features)
- Node.js compatibility: Verify if using Node.js APIs

## References

- [Bun Official Documentation](https://bun.sh/docs)
- [Bun Runtime APIs](https://bun.sh/docs/api)
- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Bun Bundler](https://bun.sh/docs/bundler)
