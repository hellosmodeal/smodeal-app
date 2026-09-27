---
paths:
  - "src/**/*.test.ts"
  - "vitest.config.ts"
---

# Vitest 5

Scope: tests and Vitest configuration.

- Config: `environment: 'node'`, tests in `src/**/*.test.ts`, no globals (import from `vitest`), `@/*` alias resolved.
  No DOM environment is configured; add one deliberately before testing components.
- Test-first (see AGENTS.md TDD): red on a public seam, minimal code, green, refactor.
- Test names describe behavior in French.
- Inject time as a `now: Date` parameter in business rules rather than faking timers.
- Mock only external boundaries (Appwrite, clock); never mock a module owned by the project to assert calls.
- Await async assertions (`await expect(p).rejects.toThrow(...)`); cover rejected paths that are part of the contract.
- Use fictitious data only.
- Run the focused file, then `pnpm test`.
