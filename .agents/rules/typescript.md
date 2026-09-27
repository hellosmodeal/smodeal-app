---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript 7

Scope: `**/*.ts`, `**/*.tsx`.

- TypeScript 7 (native compiler), `strict`, `verbatimModuleSyntax`, bundler resolution. Keep strict settings.
- Type-only imports use `import type`. Import alias: `@/*` → `src/*`.
- `pnpm typecheck` regenerates the route tree (`tsr generate`) then runs `tsc --noEmit`.
- Untrusted values are `unknown` until validated (Zod at boundaries); type assertions do not validate.
- Model closed values with `as const` literal unions (see listing statuses); handle them exhaustively.
- Avoid `any` outside a narrow adapter for an untyped dependency.
- Annotate exported functions; let local helpers infer.
- Code shared between server and browser must not import `*.server.ts` modules.
