---
name: quality-gate
description: >
  Quality gate for Apuntacelo. Run ONLY when code changes are proposed — before finalizing
  any response with edits, run lint, type-check, and all tests. Also used when writing new
  tests to ensure they actually pass.
---

# Quality Gate

You MUST run all quality checks before finalizing any response that includes or
proposes code changes. If any check fails, diagnose and fix the issue, then
re-run until all pass.

## Required checks (in order)

1. **Lint**
   ```bash
   pnpm lint
   ```

2. **Type check**
   ```bash
   pnpm type-check
   ```

3. **Contract tests**
   ```bash
   pnpm contracts:test
   ```

4. **Web app unit tests** (if available)
   ```bash
   cd apps/web && pnpm test
   ```

## Workflow

1. Make the code changes or write new tests
2. Run all four checks above **sequentially**
3. If a step fails, fix the issue (do not skip)
4. Only after all pass, present the final result to the user

## When writing tests

If the task involves writing new tests (unit, integration, or performance):

- Write the tests first
- Run the relevant test command to verify they fail initially (red)
- Implement the code
- Re-run to confirm they pass (green)
- Finally run the full quality gate above

## Performance benchmarks

For Solidity gas benchmarks:
```bash
cd apps/contracts && pnpm test:gas
```

For web app performance benchmarks:
```bash
cd apps/web && pnpm test:bench
```
